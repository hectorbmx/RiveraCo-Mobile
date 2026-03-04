import { Routes } from '@angular/router';
import { appShellGuard } from './guards/app-shell.guard';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
  path: 'home',
  canActivate: [authGuard, appShellGuard],
    loadComponent: () => import('./pages/landing/landing.page').then(m => m.LandingPage),

}
,
  {
    path:'',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
  path: 'tabs-gerencial',
  loadChildren: () => import('./tabs-gerencial/tabs-gerencial.routes').then(m => m.routes),
  canActivate: [authGuard],
},

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
    canActivate: [authGuard]
  },
  {
    path: 'empleado-detalles/:empleado_id',
    loadComponent: () => import('./pages/empleado-detalles/empleado-detalles.page').then( m => m.EmpleadoDetallesPage)
  },
  {
    path: 'maquina-registro/:obra_maquina_id',
    loadComponent: () => import('./pages/maquina-registro/maquina-registro.page').then( m => m.MaquinaRegistroPage)
  },
  {
    path: 'vehiculo-registro/:vehiculo_id',
    loadComponent: () => import('./pages/vehiculo-registro/vehiculo-registro.page').then( m => m.VehiculoRegistroPage)
  },
 
  {
    path: 'gerencial-home',
    loadComponent: () => import('./pages/gerencial-home/gerencial-home.page').then( m => m.GerencialHomePage)
  },
  {
    path: 'gerencial-obras',
    loadComponent: () => import('./pages/gerencial-obras/gerencial-obras.page').then( m => m.GerencialObrasPage)
  },
  {
    path: 'gerencial-empleados',
    loadComponent: () => import('./pages/gerencial-empleados/gerencial-empleados.page').then( m => m.GerencialEmpleadosPage)
  },
  {
    path: 'gerencial-maquinas',
    loadComponent: () => import('./pages/gerencial-maquinas/gerencial-maquinas.page').then( m => m.GerencialMaquinasPage)
  },
  {
    path: 'gerencial-inventario',
    loadComponent: () => import('./pages/gerencial-inventario/gerencial-inventario.page').then( m => m.GerencialInventarioPage)
  },
  {
    path: 'maquinas-detalles',
    loadComponent: () => import('./pages/gerencial-obras/obras-detalles/maquinas-detalles/maquinas-detalles.page').then( m => m.MaquinasDetallesPage)
  },
  {
    path: 'empleado-detalles/:id',
    loadComponent: () => import('./pages/gerencial-empleados/empleado-detalles/empleado-detalles.page').then( m => m.EmpleadoDetallesPage)
  },
  {
    path: 'maquina-detalles',
    loadComponent: () => import('./pages/gerencial-maquinas/maquina-detalles/maquina-detalles.page').then( m => m.MaquinaDetallesPage)
  },
  {
    path: 'producto',
    loadComponent: () => import('./pages/gerencial-inventario/producto/producto.page').then( m => m.ProductoPage)
  },


 
];
