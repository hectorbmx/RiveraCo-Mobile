import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const gerencialGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasToken()) {
    return router.createUrlTree(['/login']);
  }

  if (auth.hasPermission('app.gerencial.access')) {
    return true;
  }

  // si no es gerencial, lo mandamos al operativo
  return router.createUrlTree(['/tabs', 'tab1']);
};
