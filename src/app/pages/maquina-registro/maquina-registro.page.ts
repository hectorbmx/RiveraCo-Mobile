import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AlertController, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, hammerOutline } from 'ionicons/icons';
import { MaquinaService } from 'src/app/services/maquina-service';

import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard, IonCardContent, IonCardHeader, IonCardSubtitle,
  IonCardTitle,
  IonCol,
  IonContent,
  IonFooter,
  IonGrid,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonRow,
  IonSpinner,
  IonText, IonTextarea,
  IonTitle, IonToolbar
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api';
import { MaquinaRegistroIndexResponse } from 'src/app/services/auth'; // ajusta si lo moviste
// AuthService no es necesario aquí para el GET (lo puedes quitar si no lo usas)

@Component({
  selector: 'app-maquina-registro',
  templateUrl: './maquina-registro.page.html',
  styleUrls: ['./maquina-registro.page.scss'],
  standalone: true,
  imports: [IonIcon, IonBackButton, IonContent, IonHeader,IonTextarea, IonInput,IonTitle, IonToolbar,IonCol,IonBadge,IonList,IonItem,IonLabel,IonButton,IonFooter,IonText,IonModal,
    IonCardTitle,IonRow,IonGrid,IonCardHeader,IonCardSubtitle, CommonModule, FormsModule,IonSpinner,IonCard,IonCardContent,IonButtons],
})


export class MaquinaRegistroPage implements OnInit, OnDestroy {
  obraMaquinaId!: number;
  estadoPendiente: string | null = null;
  loading = true;
  errorMsg: string | null = null;
  modalFallaOpen = false;
  savingFalla = false;
  fallaError: string | null = null;

  fallaForm = {
    motivo: '' as string,
    notas: '' as string,
  };

  asignacion: MaquinaRegistroIndexResponse['asignacion'] | null = null;
  horometroSugerido: number | null = null;
  registros: MaquinaRegistroIndexResponse['registros'] = [];

  modalOpen=false;
  saving= false;

  formError: string | null = null;

    form = {
    horometro_fin: null as number | null,
    notas: '' as string
  };


  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private maquinaService: MaquinaService,
    private alertCtrl: AlertController
  ) {
    addIcons ({ hammerOutline,checkmarkCircleOutline});
  }

  ngOnInit() {
    this.obraMaquinaId = Number(this.route.snapshot.paramMap.get('obra_maquina_id')); 
    // IMPORTANTE: si cambiaste la ruta a :obra_maquina_id, cambia aquí también.

    if (!this.obraMaquinaId) {
      this.loading = false;
      this.errorMsg = 'ID de asignación no válido.';
      return;
    }

    this.cargar();
  }

  ngOnDestroy() {
    // this.sub?.unsubscribe();this.route.snapshot.paramMap.get('obra_maquina_id')

  }

  cargar() {
    this.loading = true;
    this.errorMsg = null;

    this.sub = this.api.getRegistros(this.obraMaquinaId).subscribe({
      
      next: (res) => {
        
        this.asignacion = res.asignacion;
        this.horometroSugerido = res.horometro_sugerido;
        this.registros = res.registros ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.message || 'Error al cargar registros.';
      },
    });
  }
  // ===== Modal =====

  abrirModalNuevo() {
    this.formError = null;
    // Precargar con el sugerido
    this.form.horometro_fin = this.horometroSugerido ?? 0;
    this.form.notas = '';
    this.modalOpen = true;
  }

  abrirModalCambioEstado(nuevoEstado: string) {
  this.estadoPendiente = nuevoEstado;
  this.fallaError = null;
  this.fallaForm.motivo = '';
  this.fallaForm.notas = '';
  this.modalFallaOpen = true;
}

  cerrarModal() {
    this.modalOpen = false;
    this.saving = false;
    this.formError = null;
  }
abrirModalFalla() {
  this.fallaError = null;
  this.fallaForm.motivo = '';
  this.fallaForm.notas = '';
  this.modalFallaOpen = true;
}

cerrarModalFalla() {
  this.modalFallaOpen = false;
  this.savingFalla = false;
  this.fallaError = null;
}

async cambiarEstadoDirecto(nuevoEstado: string) {
  const mensaje = nuevoEstado === 'en_reparacion' 
    ? '¿Confirmas que la máquina entra en proceso de reparación?' 
    : '¿Confirmas que la máquina ya está operativa nuevamente?';

  const alert = await this.alertCtrl.create({
    header: 'Confirmar cambio',
    message: mensaje,
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Confirmar',
        handler: () => {
          this.ejecutarCambioEstado(nuevoEstado);
        }
      }
    ]
  });

  await alert.present();
}

private ejecutarCambioEstado(nuevoEstado: string) {
  this.loading = true;
  
  const motivo = nuevoEstado === 'en_reparacion' 
    ? 'Inicio de reparación desde App' 
    : 'Reparación finalizada desde App';

  // Cambiamos el envío de un objeto a parámetros individuales
  this.maquinaService.postCambiarEstado(
    this.obraMaquinaId, // 1. ID
    nuevoEstado,        // 2. Estado (string)
    motivo              // 3. Motivo (string)
  ).subscribe({
    next: () => {
      this.cargar(); 
    },
    error: (err) => {
      this.loading = false;
      this.errorMsg = err.message;
    }
  });
}

// Modifica el método que envía la información
reportarFalla() {
  const motivo = (this.fallaForm.motivo || '').trim();
  if (!motivo) {
    this.fallaError = 'Captura el motivo del cambio.';
    return;
  }

  this.savingFalla = true;

  // Si no hay estadoPendiente, asumimos que es una falla normal (fuera_servicio)
  
  const estadoADisparar = this.estadoPendiente || 'fuera_servicio';

  this.maquinaService.postCambiarEstado(
    this.obraMaquinaId, 
    estadoADisparar, 
    motivo, 
    this.fallaForm.notas
  ).subscribe({
    next: () => {
      this.savingFalla = false;
      this.cerrarModalFalla();
      this.estadoPendiente = null;
      
      // ¡ESTO ES LO QUE FALTA PARA QUE SE ACTUALICE SOLA!
      this.cargar();
    },
    error: (err) => {
      this.savingFalla = false;
      this.fallaError = err.message;
    }
  });
}  // guardarRegistro() {
  //   this.formError = null;

  //   const fin = Number(this.form.horometro_fin);
  //   const inicio = Number(this.horometroSugerido ?? 0);

  //   if (Number.isNaN(fin) || fin < 0) {
  //     this.formError = 'Captura un horómetro final válido.';
  //     return;
  //   }

  //   if (fin < inicio) {
  //     this.formError = `El horómetro final no puede ser menor al último registrado (${inicio}).`;
  //     return;
  //   }

  //   this.saving = true;

  //   const payload: any = {
  //     horometro_fin: fin,
  //     notas: (this.form.notas || '').trim() || null,
  //     // inicio/fin opcionales: si luego los quieres desde app, los agregamos
  //   };

  //   this.api.post<any>(`maquinas/${this.obraMaquinaId}/registros`, payload).subscribe({
  //     next: () => {
  //       this.saving = false;
  //       this.cerrarModal();
  //       this.cargar(); // refrescar lista y sugerido
  //     },
  //     error: (err) => {
  //       this.saving = false;
  //       this.formError = err?.message || 'No se pudo guardar el registro.';
  //     }
  //   });
  // }

  guardarRegistro() {
       this.formError = null;

    const fin = Number(this.form.horometro_fin);
    const inicio = Number(this.horometroSugerido ?? 0);

    if (Number.isNaN(fin) || fin < 0) {
      this.formError = 'Captura un horómetro final válido.';
      return;
    }

    if (fin < inicio) {
      this.formError = `El horómetro final no puede ser menor al último registrado (${inicio}).`;
      return;
    }
  // ... tus validaciones ...
  this.saving = true;

  const payload = {
    horometro_fin: Number(this.form.horometro_fin),
    notas: (this.form.notas || '').trim() || null,
  };

  this.maquinaService.postRegistro(this.obraMaquinaId, payload).subscribe({
    next: () => {
      this.saving = false;
      this.cerrarModal();
      this.cargar();
    },
    error: (err) => {
      this.saving = false;
      this.formError = err.message;
    }
  });
}

  formatFecha(fechaISO: string): string {
  if (!fechaISO) return 'N/A';
  
  const fecha = new Date(fechaISO);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  
  return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
}
}
