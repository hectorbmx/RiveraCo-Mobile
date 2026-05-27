// import { CommonModule } from '@angular/common';
// import { Component, OnDestroy, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
// import { LoadingController, ToastController } from '@ionic/angular';
// // ❌ ELIMINAR: import imageCompression from 'browser-image-compression';

// import {
//   IonBadge,
//   IonCard,
//   IonCardContent,
//   IonCardHeader,
//   IonCardSubtitle,
//   IonCardTitle,
//   IonCol,
//   IonContent,
//   IonGrid,
//   IonHeader,
//   IonIcon,
//   IonItem,
//   IonItemOption, IonItemOptions,
//   IonItemSliding,
//   IonLabel,
//   IonList,
//   IonRefresher,
//   IonRefresherContent,
//   IonRow,
//   IonTitle,
//   IonToolbar
// } from '@ionic/angular/standalone';
// import { addIcons } from 'ionicons';
// import {
//   briefcaseOutline,
//   businessOutline,
//   cameraOutline,
//   cameraSharp,
//   checkmarkCircleOutline,
//   chevronForwardOutline,
//   constructOutline,
//   keyOutline,
//   locationOutline,
//   peopleOutline,
//   personOutline
// } from 'ionicons/icons';
// import { Subscription } from 'rxjs';
// import { ApiService } from '../services/api';
// import { AuthService, EmpleadoAsignado } from '../services/auth';

// @Component({
//   selector: 'app-tab1',
//   templateUrl: 'tab1.page.html',
//   styleUrls: ['tab1.page.scss'],
//   standalone: true,
//   imports: [IonRefresherContent, IonRefresher,  
//     CommonModule,
//     IonItemSliding,
//     IonItemOption,
//     IonBadge,
//     IonItemOptions,
//     IonCard,
//     IonCardContent,
//     IonCardHeader,
//     IonCardSubtitle,
//     IonCardTitle,
//     IonCol,
//     IonContent,
//     IonGrid,
//     IonHeader,
//     IonIcon,
//     IonItem,
//     IonLabel,
//     IonList,
//     IonRow,
//     IonTitle,
//     IonToolbar
//   ],
// })
// export class Tab1Page implements OnInit, OnDestroy {
//   empleados: EmpleadoAsignado[] = [];
//   obraNombre: string | null = null;
//   pilasCantidadProgramada  = 0;
//   empleadoId: number | null = null;
//   private sub?: Subscription;

//   constructor(
//     private auth: AuthService,
//     private router: Router,
//     private apiService: ApiService,
//     private toastController: ToastController,
//     private loadingCtrl: LoadingController
//   ) {
//     addIcons({
//       chevronForwardOutline,
//       cameraSharp,checkmarkCircleOutline,
//       cameraOutline,
//       businessOutline,
//       keyOutline,
//       locationOutline,
//       constructOutline,
//       peopleOutline,
//       personOutline,
//       briefcaseOutline,
//     });
//   }

//   ngOnInit() {
//     const ctx = this.auth.contextoValue;
//     if (ctx) {
//       this.empleados = ctx.empleados ?? [];
//       this.obraNombre = ctx.obra?.nombre ?? null;
//       const pilas = ctx.pilas ?? [];
//       this.pilasCantidadProgramada = pilas.reduce((acc, p: any) => {
//         const n = Number(p.cantidad_programada ?? 0);
//         return acc + (isNaN(n) ? 0 : n);
//       }, 0);

//       console.log('Contexto obra:', ctx.empleados);
//       console.log('Contexto obra:', this.contextoObra);
//       console.log('Máquina activa:', ctx.maquina);
//       console.log('Vehiculo asignado:', ctx.vehiculo);
//       console.log('Vehiculo catálogo:', ctx.vehiculo?.vehiculo);
//       console.log('Pilas:', ctx.pilas);
//     }

//     this.sub = this.auth.contexto$.subscribe((contexto) => {
//       if (!contexto) return;
//       this.empleados = contexto.empleados ?? [];
//       this.obraNombre = contexto.obra?.nombre ?? null;
//     });
//   }

//   private async showToast(
//     message: string,
//     color: 'success' | 'danger' | 'warning' = 'success'
//   ) {
//     const toast = await this.toastController.create({
//       message,
//       duration: 2000,
//       position: 'top',
//       color,
//       icon: 'checkmark-circle-outline',
//     });
//     await toast.present();
//   }

//   ngOnDestroy() {
//     this.sub?.unsubscribe();
//   }

//   get contextoObra() {
//     return this.auth.contextoValue?.obra;
//   }

//   get maquinaActiva() {
//     return this.auth.contextoValue?.maquina;
//   }

//   get vehuculoAsignado() {
//     return this.auth.contextoValue?.vehiculo;
//   }
  

//   verEmpleado(empleado: EmpleadoAsignado) {
//     console.log('Ver empleado:', empleado);
//     const id = empleado.empleado_id || empleado.empleado?.id_Empleado;
//     if (!id) return;

//     this.router.navigate(['/empleado-detalles', id], {
//       state: { obraId: this.contextoObra?.id }
//     });
//   }

//   async llamarEmpleado(empleado: EmpleadoAsignado) {
//     const tel = empleado.empleado?.telefono;
//     if (!tel) return;

//     const clean = tel.replace(/[^\d+]/g, '');
//     window.location.href = `tel:${clean}`;
//   }

//   getRolColor(rolNombre: string | undefined): string {
//     if (!rolNombre) return 'medium';
    
//     const rol = rolNombre.toLowerCase();
    
//     if (rol.includes('perforador')) return 'primary';
//     if (rol.includes('ayudante')) return 'secondary';
//     if (rol.includes('supervisor')) return 'warning';
//     if (rol.includes('operador')) return 'success';
    
//     return 'medium';
//   }

//   async checarEmpleado(empleado: EmpleadoAsignado) {
//   const loading = await this.loadingCtrl.create({
//     message: 'Registrando asistencia...',
//     spinner: 'crescent',
//     backdropDismiss: false
//   });

//   try {
//     await loading.present();

//     // 1) Tomar foto
//     const photo = await Camera.getPhoto({
//       quality: 90,
//       resultType: CameraResultType.Uri,
//       source: CameraSource.Camera,
//       allowEditing: false,
//       correctOrientation: true,
//       saveToGallery: false,
//     });

//     // 2) Convertir a File
//     const originalFile = await this.fileFromWebPath(
//       photo.webPath!,
//       `asistencia_${empleado.empleado_id}_${Date.now()}.jpg`
//     );

//     console.log(`📸 Foto original: ${(originalFile.size / 1024 / 1024).toFixed(2)} MB`);

//     // 3) Comprimir imagen
//     const compressedFile = await this.compressImage(originalFile);

//     console.log(`📸 Foto comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
//     console.log(`📸 Reducción: ${(((originalFile.size - compressedFile.size) / originalFile.size) * 100).toFixed(1)}%`);

//     // 4) FormData
//     // const formData = new FormData();
//     // formData.append('empleado_id', empleado.empleado_id.toString());
//     // formData.append('checked_at', new Date().toISOString());
//     // formData.append('foto', compressedFile);
//     // 4) FormData
//     const formData = new FormData();
//     formData.append('empleado_id', empleado.empleado_id.toString());
    
//     // Enviar hora local de México sin zona horaria
//     const now = new Date();
//     const horaLocal = now.toLocaleString('sv-SE', {
//       timeZone: 'America/Mexico_City',
//       year: 'numeric',
//       month: '2-digit', 
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//       hour12: false
//     }).replace(' ', 'T');
    
//     formData.append('checked_at', horaLocal);
//     formData.append('foto', compressedFile);

//     const obraId = this.contextoObra?.id;

//     if (!obraId) {
//       await loading.dismiss();
//       this.showToast('No hay obra activa', 'danger');
//       return;
//     }

//     // 5) Enviar a API
//     this.apiService.postAsistencia(obraId, formData).subscribe({
//       next: async (res) => {
//         await loading.dismiss();

//         const tipo = res?.data?.tipo;
//         const mensaje =
//           tipo === 'salida'
//             ? 'Salida registrada con éxito'
//             : 'Entrada registrada con éxito';

//         this.showToast(mensaje, 'success');
//       },
//       error: async (err) => {
//         console.error('❌ Error al registrar asistencia:', err);
//         await loading.dismiss();
//         this.showToast('Error al registrar asistencia', 'danger');
//       }
//     });

//   } catch (err) {
//     console.log('Cámara cancelada o error:', err);
//     await loading.dismiss();
//   }
// }

//   /**
//    * 🔥 COMPRESIÓN DE IMAGEN CON CANVAS NATIVO
//    * No requiere dependencias externas - funciona perfecto
//    */
//   private async compressImage(file: File): Promise<File> {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
      
//       reader.onload = (e) => {
//         const img = new Image();
        
//         img.onload = () => {
//           const canvas = document.createElement('canvas');
//           const ctx = canvas.getContext('2d');
          
//           if (!ctx) {
//             reject(new Error('No se pudo crear contexto canvas'));
//             return;
//           }
          
//           // Calcular dimensiones manteniendo aspect ratio
//           let width = img.width;
//           let height = img.height;
//           const maxSize = 1920; // Full HD
          
//           if (width > height && width > maxSize) {
//             height = (height * maxSize) / width;
//             width = maxSize;
//           } else if (height > maxSize) {
//             width = (width * maxSize) / height;
//             height = maxSize;
//           }
          
//           canvas.width = width;
//           canvas.height = height;
          
//           // Dibujar imagen redimensionada con suavizado
//           ctx.imageSmoothingEnabled = true;
//           ctx.imageSmoothingQuality = 'high';
//           ctx.drawImage(img, 0, 0, width, height);
          
//           // Convertir a Blob con compresión JPEG
//           canvas.toBlob(
//             (blob) => {
//               if (blob) {
//                 const compressedFile = new File([blob], file.name, {
//                   type: 'image/jpeg',
//                   lastModified: Date.now()
//                 });
                
//                 resolve(compressedFile);
//               } else {
//                 // Si falla, devolver original
//                 resolve(file);
//               }
//             },
//             'image/jpeg',
//             0.8 // 80% de calidad
//           );
//         };
        
//         img.onerror = () => {
//           console.error('Error al cargar imagen');
//           resolve(file); // Devolver original si falla
//         };
        
//         img.src = e.target?.result as string;
//       };
      
//       reader.onerror = () => {
//         console.error('Error al leer archivo');
//         resolve(file); // Devolver original si falla
//       };
      
//       reader.readAsDataURL(file);
//     });
//   }

//   async fileFromWebPath(webPath: string, filename = 'foto.jpg'): Promise<File> {
//     const res = await fetch(webPath);
//     const blob = await res.blob();
//     return new File([blob], filename, { type: blob.type });
//   }

//   irMaquinaRegistro(maquinaId: number) {
//     if (!maquinaId) return;
//     this.router.navigate(['/maquina-registro', maquinaId]);
//   }

//   irVehiculoRegistro(vehiculoId: number) {
//     if (!vehiculoId) return;
//     this.router.navigate(['/vehiculo-registro', vehiculoId]); 
//   }


// }

import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
import { ApiService } from '../services/api';
import { AuthService, Contexto, EmpleadoAsignado, PilaDTO } from '../services/auth';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    const loading = await this.loadingCtrl.create({
      message: 'Registrando asistencia...',
      spinner: 'crescent',
      backdropDismiss: false
    });

    try {
      await loading.present();

      const photo = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        allowEditing: false,
        correctOrientation: true,
        saveToGallery: false,
      });

      if (!photo.webPath) {
        await loading.dismiss();
        await this.showToast('No se pudo obtener la foto', 'danger');
        return;
      }

      const originalFile = await this.fileFromWebPath(
        photo.webPath,
        `asistencia_${empleado.empleado_id}_${Date.now()}.jpg`
      );

      console.log(`Foto original: ${(originalFile.size / 1024 / 1024).toFixed(2)} MB`);

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
      formData.append('foto', compressedFile);

      const obraId = this.contextoObra?.id;

      if (!obraId) {
        await loading.dismiss();
        await this.showToast('No hay obra activa', 'danger');
        return;
      }

      this.apiService.postAsistencia(obraId, formData).subscribe({
        next: async (res) => {
          await loading.dismiss();

          const tipo = res?.data?.tipo;
          const mensaje =
            tipo === 'salida'
              ? 'Salida registrada con éxito'
              : 'Entrada registrada con éxito';

          await this.showToast(mensaje, 'success');
        },
        error: async (err) => {
          console.error('Error al registrar asistencia:', err);
          await loading.dismiss();
          await this.showToast('Error al registrar asistencia', 'danger');
        }
      });

    } catch (err) {
      console.log('Cámara cancelada o error:', err);
      await loading.dismiss();
    }
  }

  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('No se pudo crear contexto canvas'));
            return;
          }

          let width = img.width;
          let height = img.height;
          const maxSize = 1920;

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
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
    this.auth.getMe().subscribe({
      next: () => {
        event?.target?.complete();
      },
      error: async (err) => {
        console.error('Error recargando contexto:', err);
        event?.target?.complete();
        await this.showToast(err.message || 'No se pudo actualizar la obra', 'danger');
      }
    });
  }
}
