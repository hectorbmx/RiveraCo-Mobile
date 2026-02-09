import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AsistenciaDiaEmpleado, AsistenciasResponse } from 'src/app/models/asistencias';
import { ApiService } from 'src/app/services/api';

import {
  AlertController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  cameraOutline, clipboardOutline, closeOutline, constructOutline, logInOutline,
  logOutOutline, searchOutline, trashOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-empleado-detalles',
  templateUrl: './empleado-detalles.page.html',
  styleUrls: ['./empleado-detalles.page.scss'],
  standalone: true,
  imports: [IonItemOption, IonItemSliding, IonFooter,IonItemOptions,
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonSpinner, IonModal, IonButton, IonIcon
  ]
})
export class EmpleadoDetallesPage implements OnInit {

  empleadoId!: number;
  obraId = 0;

  loading = false;
  items: AsistenciaDiaEmpleado[] = [];

  // header card
  empleadoNombre = '';
  empleadoPuesto = '';
  empleadoKey = '';

  // modal foto
  isPhotoModalOpen = false;
  modalPhotoUrl: string | null = null;
  modalTitle = '';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({trashOutline,searchOutline,constructOutline,clipboardOutline,logOutOutline,cameraOutline,closeOutline,logInOutline});
  }

  ngOnInit() {
    this.empleadoId = Number(this.route.snapshot.paramMap.get('empleado_id'));

    // obraId via navigation state (preferido)
    this.obraId = Number(history.state?.obraId ?? 0);

    // fallback a localStorage si aplica
    if (!this.obraId) {
      const raw = localStorage.getItem('contexto_obra');
      if (raw) {
        const obra = JSON.parse(raw);
        this.obraId = Number(obra?.id ?? 0);
      }
    }

    if (!this.obraId || !this.empleadoId) return;

    this.load();
  }

  load() {
    this.loading = true;

    // Usa el endpoint filtrado por obra + empleado (ya lo tienes)
    this.api.getAsistenciasEmpleadoObra(this.obraId, this.empleadoId).subscribe({
      next: (res: AsistenciasResponse & { empleado_id?: number }) => {
        this.items = res.data || [];

        // Tomar datos del empleado del primer item (si existe)
        const emp = this.items[0]?.empleado;
        if (emp) {
          this.empleadoNombre = `${emp.Nombre ?? ''} ${emp.Apellidos ?? ''}`.trim();
          this.empleadoPuesto = (emp.Puesto || emp.puesto_base || '').toString();
          this.empleadoKey = `ID: ${emp.id_Empleado}`;
        } else {
          this.empleadoNombre = `Empleado ${this.empleadoId}`;
          this.empleadoPuesto = '';
          this.empleadoKey = `ID: ${this.empleadoId}`;
        }

        // Ordenar por fecha DESC (más reciente arriba)
        this.items = [...this.items].sort((a, b) => b.checked_date.localeCompare(a.checked_date));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error asistencias empleado:', err);
        this.items = [];
        this.loading = false;
      }
    });
  }

async deleteAttendance(item: AsistenciaDiaEmpleado) {
    console.log('🔍 Item a eliminar:', item);
  console.log('🔍 Obra ID:', this.obraId);
  console.log('🔍 Entrada ID:', item.entrada?.id);
  console.log('🔍 Salida ID:', item.salida?.id);
  // Recopilar los IDs a eliminar (entrada y/o salida)
  const idsToDelete: number[] = [];
  
  if (item.entrada?.id) {
    idsToDelete.push(item.entrada.id);
  }
  
  if (item.salida?.id) {
    idsToDelete.push(item.salida.id);
  }

  if (idsToDelete.length === 0) {
    await this.showToast('No hay registros para eliminar', 'warning');
    return;
  }

  // Eliminar cada registro (entrada y/o salida)
  let eliminadosCount = 0;
  let erroresCount = 0;

  for (const asistenciaId of idsToDelete) {
    try {
      // Llamada a tu API
      await this.api.deleteAsistenciaObra(this.obraId, asistenciaId).toPromise();
      eliminadosCount++;
      console.log(`✅ Asistencia ${asistenciaId} eliminada`);
    } catch (error) {
      console.error(`❌ Error eliminando asistencia ${asistenciaId}:`, error);
      erroresCount++;
    }
  }

  // Mostrar resultado
  if (erroresCount === 0) {
    // Todo se eliminó correctamente
    this.items = this.items.filter(i => i.checked_date !== item.checked_date);
    await this.showToast('Registro eliminado correctamente', 'success');
  } else if (eliminadosCount > 0) {
    // Se eliminó parcialmente (entrada O salida, pero no ambas)
    this.load(); // Recargar desde el servidor para tener datos actualizados
    await this.showToast(`${eliminadosCount} de ${idsToDelete.length} registros eliminados`, 'warning');
  } else {
    // Todo falló
    await this.showToast('Error al eliminar el registro', 'danger');
  }
}
async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
  const toast = await this.toastController.create({
    message: message,
    duration: 2000,
    position: 'bottom',
    color: color,
    cssClass: 'custom-toast'
  });

  await toast.present();
}

  openPhoto(url: string | null, title: string) {
    if (!url) return;
    this.modalPhotoUrl = url;
    this.modalTitle = title;
    this.isPhotoModalOpen = true;
  }

  closePhoto() {
    this.isPhotoModalOpen = false;
    this.modalPhotoUrl = null;
    this.modalTitle = '';
  }

  // UI helpers
  formatFecha(isoDate: string) {
    // isoDate: YYYY-MM-DD
    const [y, m, d] = isoDate.split('-').map(Number);
    if (!y || !m || !d) return isoDate;
    return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
  }
formatHora(value: string | null | undefined): string {
  if (!value || value === '--:--') return '--:--';

  try {
    // Parsear la fecha (asume UTC si no tiene zona horaria)
    const date = new Date(value);
    
    // Convertir a hora de México
    return new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (error) {
    console.error('Error formateando hora:', error);
    return '--:--';
  }
}



  getBadgeStatus(a: AsistenciaDiaEmpleado) {
    if (a.entrada && a.salida) return 'COMPLETA';
    if (a.entrada && !a.salida) return 'FALTA SALIDA';
    if (!a.entrada && a.salida) return 'FALTA ENTRADA';
    return 'SIN REGISTRO';
  }

  getBadgeClass(a: AsistenciaDiaEmpleado) {
    const st = this.getBadgeStatus(a);
    if (st === 'COMPLETA') return 'badge ok';
    if (st === 'FALTA SALIDA' || st === 'FALTA ENTRADA') return 'badge warn';
    return 'badge';
  }

  trackByDate(index: number, a: AsistenciaDiaEmpleado) {
    return a.checked_date;
  }
  
  formatTimeMx(iso?: string | null): string {
  if (!iso) return '--:--';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

formatDateMx(iso?: string | null): string {
  if (!iso) return '';

  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}
}