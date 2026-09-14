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

  const paneles = auth.panelesDisponiblesValue;
  const obras = auth.obrasResidenteValue;
  const selectedPanel = auth.selectedPanelValue;
  const selectedObraId = auth.selectedObraIdValue;

  if (selectedPanel === 'gerencial' && auth.hasPermission('app.gerencial.access')) {
    return router.createUrlTree(['/tabs-gerencial']);
  }

  if (selectedPanel === 'residente') {
    if (obras.length === 1 && !selectedObraId) {
      auth.setSelectedObraId(obras[0].id);
      return router.createUrlTree(['/tabs', 'tab1']);
    }

    if (selectedObraId || obras.length <= 1) {
      return router.createUrlTree(['/tabs', 'tab1']);
    }

    return router.createUrlTree(['/selector-panel']);
  }

  if (paneles.length === 1) {
    const panel = paneles[0].key;
    auth.setSelectedPanel(panel);

    if (panel === 'gerencial') {
      return router.createUrlTree(['/tabs-gerencial']);
    }

    if (obras.length === 1) {
      auth.setSelectedObraId(obras[0].id);
      return router.createUrlTree(['/tabs', 'tab1']);
    }
  }

  if (paneles.length > 1 || obras.length > 1) {
    return router.createUrlTree(['/selector-panel']);
  }

  if (auth.hasPermission('app.gerencial.access')) {
    return router.createUrlTree(['/tabs-gerencial']);
  }

  return router.createUrlTree(['/tabs', 'tab1']);
};
