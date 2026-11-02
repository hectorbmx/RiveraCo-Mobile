import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from '@ionic/angular/standalone';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-vehiculo-adjunto', standalone: true,
  imports: [CommonModule, IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
  templateUrl: './vehiculo-adjunto.component.html',
  styleUrls: ['./vehiculo-adjunto.component.scss']
})
export class VehiculoAdjuntoComponent implements OnChanges {
  @Input() archivo: string | null | undefined;
  @Input({ required: true }) titulo = '';
  @Input() tipo: 'imagen' | 'documento' = 'imagen';
  @Input() sinArchivo = 'Sin archivo adjunto';
  url: string | null = null;
  abierto = false;
  miniaturaError = false;
  imagenError = false;
  cargando = false;
  original = false;

  ngOnChanges() {
    this.url = this.resolverUrl(this.archivo);
    this.miniaturaError = false;
    this.abierto = false;
  }
  abrir() {
    if (!this.url) return;
    this.imagenError = false;
    this.cargando = true;
    this.original = false;
    this.abierto = true;
  }
  private resolverUrl(valor: string | null | undefined): string | null {
    if (!valor?.trim()) return null;
    try {
      // Resolve relative Storage URLs against Laravel, not the Ionic host.
      const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '') + '/';
      const url = new URL(valor.trim(), base);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  }
}
