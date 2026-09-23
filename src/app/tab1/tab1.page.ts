import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { LoadingController, ToastController } from '@ionic/angular';
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
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
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
  checkmarkCircleOutline,
  chevronForwardOutline,
  constructOutline,
  keyOutline,
  locationOutline,
  peopleOutline,
  personOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CompanyLoadingOverlayComponent } from '../shared/company-loading-overlay/company-loading-overlay.component';
import { ApiService } from '../services/api';
import { AuthService, Contexto, EmpleadoAsignado, PilaDTO } from '../services/auth';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CompanyLoadingOverlayComponent,
    IonRefresher,
    IonRefresherContent,
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
  contexto: Contexto | null = null;
  loadingContext = false;
  private sub?: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private apiService: ApiService,
    private toastController: ToastController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({
      chevronForwardOutline,
      cameraSharp,
      checkmarkCircleOutline,
      cameraOutline,
      businessOutline,
      keyOutline,
      locationOutline,
      constructOutline,
      peopleOutline,
      personOutline,
      briefcaseOutline,
    });
  }

  ngOnInit() {
    this.contexto = this.auth.contextoValue;

    console.log('Contexto inicial:', this.contexto);
    console.log('Obra:', this.contexto?.obra);
    console.log('Empleados:', this.contexto?.empleados);
    console.log('Máquina activa:', this.contexto?.maquina);
    console.log('Vehículo asignado:', this.contexto?.vehiculo);
    console.log('Pilas:', this.contexto?.pilas);

    this.sub = this.auth.contexto$.subscribe((contexto) => {
      if (!contexto) return;

      this.contexto = contexto;

      console.log('Contexto actualizado:', contexto);
      console.log('Obra actualizada:', contexto.obra);
      console.log('Empleados actualizados:', contexto.empleados);
      console.log('Máquina actualizada:', contexto.maquina);
      console.log('Vehículo actualizado:', contexto.vehiculo);
      console.log('Pilas actualizadas:', contexto.pilas);
    });
  }

  ionViewWillEnter() {
    this.recargarContexto();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const icon =
      color === 'danger'
        ? 'close-circle-outline'
        : color === 'warning'
        ? 'alert-circle-outline'
        : 'checkmark-circle-outline';

    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color,
      icon,
    });

    await toast.present();
  }

  get contextoObra() {
    return this.contexto?.obra ?? null;
  }

  get maquinaActiva() {
    return this.contexto?.maquina ?? null;
  }

  get vehiculoAsignado() {
    return this.contexto?.vehiculo ?? null;
  }

  get empleados(): EmpleadoAsignado[] {
    return this.contexto?.empleados ?? [];
  }

  get pilas(): PilaDTO[] {
    return this.contexto?.pilas ?? [];
  }

  get pilasCantidadProgramada(): number {
    return this.pilas.reduce((acc, p) => {
      const n = Number(p.cantidad_programada ?? 0);
      return acc + (isNaN(n) ? 0 : n);
    }, 0);
  }

  verEmpleado(empleado: EmpleadoAsignado) {
    console.log('Ver empleado:', empleado);

    const id = empleado.empleado_id || empleado.empleado?.id_Empleado;
    if (!id) return;

    this.router.navigate(['/empleado-detalles', id], {
      state: { obraId: this.contextoObra?.id }
    });
  }

  async llamarEmpleado(empleado: EmpleadoAsignado) {
    const tel = empleado.empleado?.telefono;
    if (!tel) return;

    const clean = tel.replace(/[^\d+]/g, '');
    window.location.href = `tel:${clean}`;
  }

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
    let loading: HTMLIonLoadingElement | null = null;

    try {
      this.debugChecada('inicio', {
        empleado_id: empleado.empleado_id,
        empleado: empleado.empleado?.nombre ?? '',
        obra_id: this.contextoObra?.id,
        platform: Capacitor.getPlatform(),
      });

      const originalFile = await this.tomarFotoAsistenciaFile(
        `asistencia_${empleado.empleado_id}_${Date.now()}.jpg`
      );

      if (!originalFile) {
        await this.showToast('No se selecciono foto', 'warning');
        return;
      }

      this.debugChecada('foto_obtenida', {
        name: originalFile.name,
        size: originalFile.size,
        type: originalFile.type,
      });

      loading = await this.loadingCtrl.create({
        message: 'Registrando asistencia...',
        spinner: 'crescent',
        cssClass: 'company-loading',
        backdropDismiss: false
      });
      await loading.present();
      this.debugChecada('loading_presentado');

      console.log(`Foto original: ${(originalFile.size / 1024 / 1024).toFixed(2)} MB`);

      this.debugChecada('comprimiendo_foto');
      const compressedFile = await this.compressImage(originalFile);

      console.log(`Foto comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

      const formData = new FormData();
      formData.append('empleado_id', empleado.empleado_id.toString());

      const now = new Date();
      const horaLocal = now.toLocaleString('sv-SE', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(' ', 'T');

      formData.append('checked_at', horaLocal);
      formData.append('foto', compressedFile, compressedFile.name);
      this.debugChecada('formdata_listo', {
        empleado_id: empleado.empleado_id,
        checked_at: horaLocal,
        foto_nombre: compressedFile.name,
        foto_size: compressedFile.size,
        foto_type: compressedFile.type,
      });

      const obraId = this.contextoObra?.id;

      if (!obraId) {
        await loading.dismiss();
        await this.showToast('No hay obra activa', 'danger');
        return;
      }

      this.debugChecada('post_asistencia_enviando', { obra_id: obraId });
      this.apiService.postAsistencia(obraId, formData).subscribe({
        next: async (res) => {
          this.debugChecada('post_asistencia_ok', res);
          await loading?.dismiss();

          const tipo = res?.data?.tipo;
          const mensaje =
            tipo === 'salida'
              ? 'Salida registrada con exito'
              : 'Entrada registrada con exito';

          await this.showToast(mensaje, 'success');
          this.recargarContexto();
        },
        error: async (err) => {
          this.debugChecada('post_asistencia_error', err);
          console.error('Error al registrar asistencia:', err);
          await loading?.dismiss();
          await this.showToast(err?.message || 'Error al registrar asistencia', 'danger');
        }
      });

    } catch (err: any) {
      this.debugChecada('camara_o_flujo_error', err);
      console.log('Camara cancelada o error:', err);
      await loading?.dismiss();
      await this.showToast(err?.message || 'Camara cancelada o error', 'warning');
    }
  }
  private debugChecada(step: string, data?: unknown): void {
    const payload = data instanceof Error
      ? { name: data.name, message: data.message, stack: data.stack }
      : data;

    console.info(`[SIRICO-CHECADA] ${step}`, payload ?? '');
  }
  private async tomarFotoAsistenciaFile(filename: string): Promise<File | null> {
    const isWeb = Capacitor.getPlatform() === 'web';

    if (isWeb) {
      return this.pickImageFromBrowser(filename);
    }

    const currentPermissions = await Camera.checkPermissions();
    this.debugChecada('permisos_actuales', currentPermissions);
    if (currentPermissions.camera !== 'granted') {
      const requestedPermissions = await Camera.requestPermissions({ permissions: ['camera'] });
      if (requestedPermissions.camera !== 'granted') {
        throw new Error('Permiso de camara denegado');
      }
    }

    this.debugChecada('camera_getPhoto_inicio');
    const photo = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      allowEditing: false,
      correctOrientation: true,
      saveToGallery: false,
    });

    this.debugChecada('camera_getPhoto_resultado', { webPath: photo.webPath, path: photo.path, format: photo.format, saved: photo.saved });

    if (!photo.webPath) {
      return null;
    }

    const file = await this.fileFromWebPath(photo.webPath, filename);
    this.debugChecada('file_desde_webpath_ok', { name: file.name, size: file.size, type: file.type });
    return file;
  }

  private pickImageFromBrowser(filename: string): Promise<File | null> {
    this.debugChecada('browser_file_picker_inicio', { filename });
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      input.style.opacity = '0';

      const cleanup = () => {
        input.remove();
      };

      input.addEventListener('change', () => {
        const file = input.files?.item(0) ?? null;
        cleanup();

        this.debugChecada('browser_file_picker_change', file ? { name: file.name, size: file.size, type: file.type } : null);

        if (!file) {
          resolve(null);
          return;
        }

        const ext = file.type === 'image/png' ? 'png' : 'jpg';
        const safeName = filename.replace(/\.[^.]+$/, '') + '.' + ext;
        resolve(new File([file], safeName, { type: file.type || 'image/jpeg', lastModified: Date.now() }));
      }, { once: true });

      document.body.appendChild(input);
      input.click();
    });
  }
  private async compressImage(file: File): Promise<File> {
    const maxBytes = 3.7 * 1024 * 1024;

    if (file.size <= maxBytes && file.type === 'image/jpeg') {
      return file;
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(file);
            return;
          }

          const renderBlob = (maxSize: number, quality: number) => new Promise<Blob | null>((done) => {
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            } else if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(done, 'image/jpeg', quality);
          });

          const attempts = [
            { maxSize: 1600, quality: 0.78 },
            { maxSize: 1400, quality: 0.72 },
            { maxSize: 1200, quality: 0.68 },
            { maxSize: 1000, quality: 0.62 },
          ];

          let bestBlob: Blob | null = null;
          for (const attempt of attempts) {
            const blob = await renderBlob(attempt.maxSize, attempt.quality);
            if (!blob) continue;

            bestBlob = blob;
            if (blob.size <= maxBytes) break;
          }

          if (!bestBlob) {
            resolve(file);
            return;
          }

          resolve(new File([bestBlob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now()
          }));
        };

        img.onerror = () => {
          console.error('Error al cargar imagen');
          resolve(file);
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        console.error('Error al leer archivo');
        resolve(file);
      };

      reader.readAsDataURL(file);
    });
  }

  async fileFromWebPath(webPath: string, filename = 'foto.jpg'): Promise<File> {
    const res = await fetch(webPath);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  }

  irMaquinaRegistro(obraMaquinaId: number) {
    if (!obraMaquinaId) return;
    this.router.navigate(['/maquina-registro', obraMaquinaId]);
  }

  irVehiculoRegistro(vehiculoId: number) {
    if (!vehiculoId) return;
    this.router.navigate(['/vehiculo-registro', vehiculoId]);
  }

  doRefresh(event: any) {
    this.recargarContexto(event);
  }

  private recargarContexto(event?: any) {
    this.loadingContext = true;
    this.auth.getMe().subscribe({
      next: () => {
        this.loadingContext = false;
        event?.target?.complete();
      },
      error: async (err) => {
        this.loadingContext = false;
        console.error('Error recargando contexto:', err);
        event?.target?.complete();
        await this.showToast(err.message || 'No se pudo actualizar la obra', 'danger');
      }
    });
  }
}






