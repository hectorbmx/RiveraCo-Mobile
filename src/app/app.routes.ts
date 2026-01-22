import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  {
    path:'',
    redirectTo: 'login',
    pathMatch: 'full',
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
    path: 'maquina-registro/:maquina_id',
    loadComponent: () => import('./pages/maquina-registro/maquina-registro.page').then( m => m.MaquinaRegistroPage)
  },
  {
    path: 'vehiculo-registro/:vehiculo_id',
    loadComponent: () => import('./pages/vehiculo-registro/vehiculo-registro.page').then( m => m.VehiculoRegistroPage)
  },
  
];
