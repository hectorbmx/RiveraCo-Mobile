import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({ providedIn: 'root' })
export class MecanicoFotoService {
  async capturar(): Promise<File | null> {
    try {
      const foto = await Camera.getPhoto({ quality: 85, resultType: CameraResultType.Uri, source: CameraSource.Camera,
        allowEditing: false, correctOrientation: true, saveToGallery: false });
      if (!foto.webPath) throw new Error('No se pudo obtener la fotografía.');
      const response = await fetch(foto.webPath);
      if (!response.ok) throw new Error('No se pudo leer la fotografía.');
      const contenido = await response.blob();
      return new File([contenido], `evidencia-${Date.now()}.${foto.format || 'jpg'}`, { type: contenido.type || 'image/jpeg' });
    } catch (error: any) {
      if (String(error?.code || '').includes('CANCEL') || /cancel/i.test(error?.message || '')) return null;
      throw error;
    }
  }
}
