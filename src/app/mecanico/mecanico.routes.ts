import { Routes } from '@angular/router';
import { mecanicoGuard } from '../guards/mecanico.guard';

export const routes: Routes = [{
  path: '',
  loadComponent: () => import('./mecanico-shell.page').then(m => m.MecanicoShellPage),
  canActivateChild: [mecanicoGuard],
  children: [
    { path: 'servicios/nuevo', loadComponent: () => import('./mecanico-servicio-form.page').then(m => m.MecanicoServicioFormPage) },
    { path: 'servicios/:id/editar', loadComponent: () => import('./mecanico-servicio-form.page').then(m => m.MecanicoServicioFormPage) },
    { path: 'productos', loadComponent: () => import('./mecanico-productos.page').then(m => m.MecanicoProductosPage) },
    { path: '', redirectTo: 'servicios', pathMatch: 'full' },
    { path: 'vehiculos/:id', data: { panel: 'mecanico' },
      loadComponent: () => import('../pages/gerencial-vehiculos/vehiculo-detalles/vehiculo-detalles.page').then(m => m.VehiculoDetallesPage) },
    ...(['maquinas', 'vehiculos', 'servicios'] as const).reduce<Routes>((result, recurso) => result.concat([
      { path: recurso, data: { recurso }, loadComponent: () => import('./mecanico-consulta.page').then(m => m.MecanicoConsultaPage) },
      ...(recurso === 'vehiculos' ? [] : [{ path: `${recurso}/:id`, data: { recurso }, loadComponent: () => import('./mecanico-consulta.page').then(m => m.MecanicoConsultaPage) }]),
    ]), []),
  ],
}];
