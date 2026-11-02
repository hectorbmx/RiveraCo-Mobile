import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const appShellGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.hasToken()) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  const paneles = auth.panelesDisponiblesValue;
  const obras = auth.obrasResidenteValue;
  const selected = auth.selectedPanelValue;
  if (selected && paneles.length && !paneles.some(p => p.key === selected)) auth.setSelectedPanel(null);
  const panel = auth.selectedPanelValue;
  if (panel === 'mecanico' && auth.hasPermission('app.mecanico.access')) {
    auth.setSelectedObraId(null);
    return router.createUrlTree(['/tabs-mecanico', 'servicios']);
  }
  if (panel === 'gerencial' && auth.hasPermission('app.gerencial.access')) return router.createUrlTree(['/tabs-gerencial']);
  if (panel === 'residente') {
    if (obras.length === 1 && !auth.selectedObraIdValue) auth.setSelectedObraId(obras[0].id);
    return router.createUrlTree(auth.selectedObraIdValue || obras.length <= 1 ? ['/tabs', 'tab1'] : ['/selector-panel']);
  }
  if (paneles.length === 1) {
    const unico = paneles[0].key;
    auth.setSelectedPanel(unico);
    if (unico === 'mecanico') {
      auth.setSelectedObraId(null);
      return router.createUrlTree(['/tabs-mecanico', 'servicios']);
    }
    if (unico === 'gerencial') return router.createUrlTree(['/tabs-gerencial']);
    if (unico === 'residente' && obras.length <= 1) {
      if (obras.length) auth.setSelectedObraId(obras[0].id);
      return router.createUrlTree(['/tabs', 'tab1']);
    }
  }
  if (paneles.length > 1 || obras.length > 1) return router.createUrlTree(['/selector-panel']);
  // Compatibilidad de sesiones anteriores sin opciones de panel hidratadas.
  if (auth.hasPermission('app.mecanico.access')) return router.createUrlTree(['/tabs-mecanico', 'servicios']);
  if (auth.hasPermission('app.gerencial.access')) return router.createUrlTree(['/tabs-gerencial']);
  return router.createUrlTree(['/tabs', 'tab1']);
};
