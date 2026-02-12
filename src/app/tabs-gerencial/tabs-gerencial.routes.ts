import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth-guard';
import { gerencialGuard } from '../guards/gerencial-guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [authGuard,gerencialGuard],
    loadComponent: () =>
      import('./tabs-gerencial.page').then(m => m.TabsGerencialPage),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('../pages/gerencial-home/gerencial-home.page').then(m => m.GerencialHomePage),
      },
       {
        path: 'obras',
        loadComponent: () =>
          import('../pages/gerencial-obras/gerencial-obras.page').then(m => m.GerencialObrasPage),
      },
      {
        path: 'obras-detalles/:id',
        loadComponent: () =>
          import('../pages/gerencial-obras/obras-detalles/obras-detalles.page')
            .then(m => m.ObrasDetallesPage),
      },
     
      {
        path: 'maquina-detalle/:maquinaId',
        loadComponent: () =>
          import('../pages/gerencial-obras/obras-detalles/maquinas-detalles/maquinas-detalles.page')
            .then(m => m.MaquinasDetallesPage),
      },


      {
        path: 'maquinas',
        loadComponent: () =>
          import('../pages/gerencial-maquinas/gerencial-maquinas.page').then(m => m.GerencialMaquinasPage),
      },
      {
        path: 'empleados',
        loadComponent: () =>
          import('../pages/gerencial-empleados/gerencial-empleados.page').then(m => m.GerencialEmpleadosPage),
      },
      {
        path: 'inventario',
        loadComponent: () =>
          import('../pages/gerencial-inventario/gerencial-inventario.page').then(m => m.GerencialInventarioPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
