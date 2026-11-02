import { DestroyRef, Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import type { RefresherCustomEvent } from '@ionic/core';
import { Subscription } from 'rxjs';
import { MecanicoLoadingService } from './mecanico-loading.service';

@Injectable({ providedIn: 'root' })
export class RefrescoConsultaService {
  constructor(private loader: MecanicoLoadingService, private router: Router) {}
  ejecutar(event: RefresherCustomEvent, accion: (completar: () => void) => void, destroy: DestroyRef) {
    const cerrar = this.loader.iniciar('Actualizando información…');
    let terminado = false; let quitarDestroy = () => {}; let navegacion: Subscription | undefined;
    const completar = () => {
      if (terminado) return;
      terminado = true; cerrar(); void event.target.complete(); quitarDestroy(); navegacion?.unsubscribe();
    };
    quitarDestroy = destroy.onDestroy(completar);
    navegacion = this.router.events.subscribe(e => { if (e instanceof NavigationStart) completar(); });
    try { accion(completar); } catch (error) { completar(); throw error; }
  }
}
