import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const appShellGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.hasToken()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // ✅ Gerencial
  if (auth.hasPermission('app.gerencial.access')) {
    return router.createUrlTree(['/tabs-gerencial']);
  }

  // ✅ Operativo
  return router.createUrlTree(['/tabs', 'tab1']);
};
