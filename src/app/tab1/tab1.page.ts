import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ToastController } from '@ionic/angular';

import {
  IonBadge,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption, IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonRow,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  briefcaseOutline,
  businessOutline,
  cameraOutline,
  cameraSharp,
  chevronForwardOutline,
  constructOutline,
  keyOutline,
  locationOutline,
  peopleOutline,
  personOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ApiService } from '../services/api';
import { AuthService, EmpleadoAsignado } from '../services/auth'; // ajusta ruta real
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonItemSliding,
    IonItemOption,
    IonBadge,
    IonItemOptions,
    
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonRow,
    IonTitle,
    IonToolbar
  ],
})
export class Tab1Page implements OnInit, OnDestroy {
  empleados: EmpleadoAsignado[] = [];
  obraNombre: string | null = null;
  pilasCantidadProgramada  = 0;

  private sub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
     private toastController: ToastController
  ) {
    // Registrar los iconos que vamos a usar
    addIcons({chevronForwardOutline,cameraSharp,cameraOutline,businessOutline,keyOutline,locationOutline,constructOutline,peopleOutline,personOutline,briefcaseOutline,});
  }

  ngOnInit() {
    // 1) Cargar rápido desde lo que ya está en memoria (si existe)
    const ctx = this.auth.contextoValue;
    if (ctx) {
      this.empleados = ctx.empleados ?? [];
      this.obraNombre = ctx.obra?.nombre ?? null;
      const pilas = ctx.pilas ?? [];
      this.pilasCantidadProgramada = pilas.reduce((acc, p: any) => {
      const n = Number(p.cantidad_programada ?? 0);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);

      // console.log('Empleados cargados:', this.empleados);
      console.log('Contexto obra:', ctx.empleados);
      console.log('Contexto obra:', this.contextoObra);
      console.log('Máquina activa:', ctx.maquina);
      console.log('Vehiculo asignado:', ctx.vehiculo);
      console.log('Vehiculo catálogo:', ctx.vehiculo?.vehiculo);
      console.log('Pilas:', ctx.pilas);

    }

    // 2) Mantenerlo actualizado si cambia (ej. cuando llames getMe())
    this.sub = this.auth.contexto$.subscribe((contexto) => {
      if (!contexto) return;
      this.empleados = contexto.empleados ?? [];
      this.obraNombre = contexto.obra?.nombre ?? null;
      
    });
  }
private async showToast(
  message: string,
  color: 'success' | 'danger' | 'warning' = 'success'
) {
  const toast = await this.toastController.create({
    message,
    duration: 2000,
    position: 'top',
    color,
    icon: 'checkmark-circle-outline',
  });
  await toast.present();
}

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // Getter para acceder a la obra completa
  get contextoObra() {
    return this.auth.contextoValue?.obra;
  }

  // Getter para acceder a la máquina activa
  get maquinaActiva() {
    return this.auth.contextoValue?.maquina;
  }
  get vehuculoAsignado() {
    return this.auth.contextoValue?.vehiculo;
  }

verEmpleado(empleado: EmpleadoAsignado) {
  // aquí después lo podemos abrir en modal o navegar a detalle
  console.log('Ver empleado:', empleado);
   const id = empleado.empleado_id || empleado.empleado?.id_Empleado;
  if (!id) return;

  this.router.navigate(['/empleado-detalles', id]);
}

async llamarEmpleado(empleado: EmpleadoAsignado) {
  const tel = empleado.empleado?.telefono;
  if (!tel) return;

  // Normalizar a algo marcable (opcional)
  const clean = tel.replace(/[^\d+]/g, '');

  // En móvil, esto dispara la llamada (en web puede no hacer nada)
  window.location.href = `tel:${clean}`;
}

  // Método para asignar colores según el rol
  getRolColor(rolNombre: string | undefined): string {
    if (!rolNombre) return 'medium';
    
    const rol = rolNombre.toLowerCase();
    
    if (rol.includes('perforador')) return 'primary';
    if (rol.includes('ayudante')) return 'secondary';
    if (rol.includes('supervisor')) return 'warning';
    if (rol.includes('operador')) return 'success';
    
    return 'medium';
  }

 async checarEmpleado(empleado: EmpleadoAsignado) {
  try {
    const photo = await Camera.getPhoto({
      quality: 70,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      allowEditing: false,
      correctOrientation: true,
      saveToGallery: false,
    });

    // 1) Convertir foto a File
    const file = await this.fileFromWebPath(
      photo.webPath!,
      `asistencia_${empleado.empleado_id}_${Date.now()}.jpg`
    );

    // 2) Construir FormData
    const formData = new FormData();
    formData.append('empleado_id', empleado.empleado_id.toString());
    formData.append('checked_at', new Date().toISOString());
    formData.append('foto', file);

    // (opcional) ubicación si ya la tienes
    // formData.append('lat', this.lat.toString());
    // formData.append('lng', this.lng.toString());
    const obraId = this.contextoObra?.id;

    if (!obraId) {
      console.error('No hay obra activa en contexto');
      return;
    }
    // 3) Llamar API
    this.apiService.postAsistencia(obraId, formData).subscribe({
      next: (res) => {
        console.log('Asistencia registrada:', res);
          const tipo = res?.data?.tipo; // 'entrada' | 'salida' (según tu API)
        const mensaje =
          tipo === 'salida'
            ? 'Salida registrada con éxito'
            : 'Entrada registrada con éxito';

         this.showToast(mensaje, 'success');
        // aquí puedes mostrar toast:
        // “Entrada registrada” o “Salida registrada” según res.data.tipo
      },
      error: (err) => {
        console.error('Error al registrar asistencia:', err.message);
             this.showToast('Error al registrar asistencia', 'danger');

      }
    });

  } catch (err) {
    // Cancelación de cámara o error
    console.log('Cámara cancelada o error:', err);
  }
}
// checarEmpleadoDesdeArchivo(event: any, empleado: EmpleadoAsignado) {
//   const file: File = event.target.files[0];
//   if (!file) return;

//   const formData = new FormData();
//   formData.append('empleado_id', empleado.empleado_id.toString());
//   formData.append('checked_at', new Date().toISOString());
//   formData.append('foto', file);
// const obraNombre = this.contextoObra?.nombre;

// if (!obraNombre) {
//   console.error('No hay obra activa en contexto');
//   return;
// }
//   this.apiService.postAsistencia(obraNombre, formData).subscribe({
//     next: (res) => console.log('Asistencia registrada:', res),
//     error: (err) => console.error(err),
//   });
// }

async fileFromWebPath(webPath: string, filename = 'foto.jpg'): Promise<File> {
  const res = await fetch(webPath);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
}

//registrar las horas maquina diario
irMaquinaRegistro(maquinaId: number) {
  if (!maquinaId) return;
  this.router.navigate(['/maquina-registro', maquinaId]);
}
irVehiculoRegistro(vehiculoId: number) {
  if (!vehiculoId) return;
  this.router.navigate(['/vehiculo-registro', vehiculoId]); 
}
}