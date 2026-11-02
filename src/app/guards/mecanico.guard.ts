import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastController } from '@ionic/angular/standalone';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';

export const mecanicoGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastController);
  if (!auth.hasToken()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  // La entrada no depende de la obra que quedó seleccionada en otro panel.
  auth.setSelectedObraId(null);
  try {
    await firstValueFrom(auth.getMe());
    if (auth.hasPermission('app.mecanico.access') && auth.panelesDisponiblesValue.some(p => p.key === 'mecanico')) {
      auth.setSelectedPanel('mecanico');
      auth.setSelectedObraId(null);
      return true;
    }
    auth.setSelectedPanel(null);
    const aviso = await toast.create({ message: 'Tu sesión ya no tiene acceso al panel mecánico.', duration: 3000, color: 'warning' });
    await aviso.present();
    return router.createUrlTree(['/home']);
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      auth.logout();
      return router.createUrlTree(['/login']);
    }
    const aviso = await toast.create({ message: error?.message || 'No se pudo verificar tu acceso. Vuelve a intentarlo.', duration: 3500, color: 'danger' });
    await aviso.present();
    return router.createUrlTree(['/selector-panel']);
  }
};
