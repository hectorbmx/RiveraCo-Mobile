import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
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
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { ApiService } from 'src/app/services/api';

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

type VehiculoKmLog = {
  id: number;
  vehiculo_empleado_id: number;
  fecha: string;
  km: number;
  foto_url: string;
  notas?: string | null;
};

@Component({
  selector: 'app-vehiculo-registro',
  templateUrl: './vehiculo-registro.page.html',
  styleUrls: ['./vehiculo-registro.page.scss'],
  standalone: true,
  imports: [
    IonBackButton, IonContent, IonHeader, IonTextarea, IonInput, IonTitle, IonToolbar,
    IonCol, IonBadge, IonList, IonItem, IonLabel, IonButton, IonFooter, IonText, IonModal,
    IonCardTitle, IonRow, IonGrid, IonCardHeader, IonCardSubtitle, CommonModule, FormsModule,
    IonSpinner, IonCard, IonCardContent, IonButtons
  ],
})
export class VehiculoRegistroPage implements OnInit, OnDestroy {

  vehiculoId!: number;

  loading = true;
  errorMsg: string | null = null;

  // Si después decides traer info del vehículo asignado, aquí se guarda (por ahora puede quedar null)
  asignacion: any | null = null;

  kmSugerido: number | null = null;
  registros: VehiculoKmLog[] = [];

  modalOpen = false;
  saving = false;
  formError: string | null = null;

  form = {
    km: null as number | null,
    notas: '' as string,

    // foto
    photoFile: null as File | null,
    photoPreview: '' as string, // webPath para mostrar preview en HTML si quieres
  };

  private sub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit() {
    this.vehiculoId = Number(this.route.snapshot.paramMap.get('vehiculo_id'));

    if (!this.vehiculoId) {
      this.loading = false;
      this.errorMsg = 'ID de vehículo no válido.';
      return;
    }

    this.cargar();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  cargar() {
    this.loading = true;
    this.errorMsg = null;

    // Si ya implementaste GET /api/v1/vehiculos/km-log, aquí lo consumimos.
    // Si no existe aún, coméntalo y por ahora solo funcionará el POST.
    this.sub = this.api.get<any>('vehiculos/km-log').subscribe({
      next: (res) => {
        // Formato esperado recomendado:
        // { ok: true, vehiculo_empleado_id: X, data: [...] }
        const arr = res?.data ?? res?.registros ?? [];
        this.registros = Array.isArray(arr) ? arr : [];

        // km sugerido: el más reciente (asumiendo que viene desc). Si no, toma max.
        if (this.registros.length > 0) {
          this.kmSugerido = Number(this.registros[0]?.km ?? 0);
        } else {
          this.kmSugerido = 0;
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;

        // Si todavía no existe el GET, puedes dejar la pantalla sin historial
        // y permitir solo capturar.
        // Si quieres tratar 404 como vacío:
        const msg = err?.message || '';
        if (msg.includes('404')) {
          this.registros = [];
          this.kmSugerido = 0;
          return;
        }

        this.errorMsg = err?.message || 'Error al cargar registros.';
      },
    });
  }

  // ===== Modal =====

  abrirModalNuevo() {
    this.formError = null;
    this.form.km = this.kmSugerido ?? 0;
    this.form.notas = '';
    this.form.photoFile = null;
    this.form.photoPreview = '';
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
    this.saving = false;
    this.formError = null;
  }

  // ===== Foto =====

  async tomarFoto() {
    this.formError = null;

    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        allowEditing: false,
        correctOrientation: true,
        saveToGallery: false,
      });

      if (!photo.webPath) {
        this.formError = 'No se pudo obtener la foto.';
        return;
      }

      this.form.photoPreview = photo.webPath;

      const file = await this.fileFromWebPath(
        photo.webPath,
        `km_${this.vehiculoId}_${Date.now()}.jpg`
      );

      this.form.photoFile = file;
    } catch (e) {
      // usuario canceló o error cámara
      this.formError = 'No se pudo tomar la foto.';
    }
  }

  private async fileFromWebPath(webPath: string, filename: string): Promise<File> {
    const res = await fetch(webPath);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }

  // ===== Guardar =====

  guardarRegistro() {
    this.formError = null;

    const km = Number(this.form.km);
    const minimo = Number(this.kmSugerido ?? 0);

    if (!this.form.photoFile) {
      this.formError = 'Toma una foto del odómetro.';
      return;
    }

    if (Number.isNaN(km) || km < 0) {
      this.formError = 'Captura un kilometraje válido.';
      return;
    }

    if (km < minimo) {
      this.formError = `El kilometraje no puede ser menor al último registrado (${minimo}).`;
      return;
    }

    this.saving = true;

const fd = new FormData();
fd.append('km', String(km));
fd.append('foto', this.form.photoFile);

const notas = (this.form.notas || '').trim();
if (notas) fd.append('notas', notas);

    // IMPORTANTE: Tu ApiService debe soportar FormData.
    // Si tu ApiService tiene un método especial (ej. postFormData), lo usamos.
    // Aquí asumo que `post` acepta FormData y deja el Content-Type al browser.
    this.api.postKmLog(fd).subscribe({
      next: async (res) => {
        this.saving = false;

        if (!res?.ok) {
          this.formError = res?.message || 'No se pudo guardar el registro.';
          return;
        }

        await this.showToast('Kilometraje registrado correctamente.', 'success');
        this.cerrarModal();

        // refrescar lista / sugerido
        this.cargar();
      },
      error: (err) => {
  this.saving = false;

  // Laravel manda { message, errors: { km:[], foto:[] } }
  const backendMsg =
    err?.error?.message ||
    (err?.error?.errors ? Object.values(err.error.errors).join(' ') : null) ||
    null;

  this.formError = backendMsg || 'No se pudo guardar el registro.';
}
,
    });
  }

  // ===== Util =====

  async showToast(message: string, color: 'success' | 'danger' | 'warning' | 'medium' = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1800,
      position: 'top',
      color,
    });
    await toast.present();
  }

  formatFecha(fechaISO: string): string {
    if (!fechaISO) return 'N/A';

    const fecha = new Date(fechaISO.replace(' ', 'T'));
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    const horas = fecha.getHours().toString().padStart(2, '0');
    const minutos = fecha.getMinutes().toString().padStart(2, '0');

    return `${dia}/${mes}/${anio} ${horas}:${minutos}`;
  }
}
