import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const operativoPanelGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const paneles = auth.panelesDisponiblesValue;
  // Preserva el acceso legacy gerencial; el mecánico exclusivo no abre el panel residente.
  if (paneles.some(p => p.key === 'residente') || auth.hasPermission('app.gerencial.access')) return true;
  if (auth.hasPermission('app.mecanico.access') || paneles.length) return router.createUrlTree(['/home']);
  return true;
};
