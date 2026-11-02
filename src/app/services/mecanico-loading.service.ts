import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular/standalone';

/** Comparte el loader corporativo sin cerrar overlays pertenecientes a otras pantallas. */
@Injectable({ providedIn: 'root' })
export class MecanicoLoadingService {
  private solicitudes = new Map<symbol, string>();
  private loading: HTMLIonLoadingElement | null = null;
  private transicion: Promise<void> = Promise.resolve();

  constructor(private controller: LoadingController) {}

  iniciar(message: string): () => void {
    const id = Symbol('movimiento-mecanico');
    this.solicitudes.set(id, message);
    this.sincronizar();
    return () => { if (this.solicitudes.delete(id)) this.sincronizar(); };
  }

  private sincronizar(): void {
    // Serializar presentación/cierre evita overlays huérfanos cuando termina una
    // petición mientras Ionic crea el overlay o empieza otra operación.
    this.transicion = this.transicion.then(async () => {
      if (!this.solicitudes.size) {
        const actual = this.loading; this.loading = null;
        if (actual) await actual.dismiss();
        return;
      }
      const message = this.solicitudes.values().next().value ?? 'Procesando movimiento…';
      if (this.loading) { this.loading.message = message; return; }
      const actual = await this.controller.create({ message, spinner: 'crescent',
        cssClass: 'company-loading', backdropDismiss: false, keyboardClose: false });
      if (!this.solicitudes.size) { actual.remove(); return; }
      this.loading = actual;
      await actual.present();
    }).catch(() => {
      // Un fallo visual nunca debe impedir, repetir ni alterar un guardado.
      const actual = this.loading; this.loading = null;
      if (actual) actual.remove();
    });
  }
}
