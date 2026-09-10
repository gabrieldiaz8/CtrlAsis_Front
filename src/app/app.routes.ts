import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/layout';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Login' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Dashboard' },
      { path: 'acceso', loadComponent: () => import('./features/acceso/acceso.component').then(m => m.AccesoComponent), title: 'Control de Acceso' },
      { path: 'socios', loadComponent: () => import('./features/socios/socios.component').then(m => m.SociosComponent), title: 'Socios' },
      { path: 'planes', loadComponent: () => import('./features/planes/planes.component').then(m => m.PlanesComponent), title: 'Planes' },
      { path: 'pagos', loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent), title: 'Pagos' },
      { path: 'configuracion', loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent), title: 'Configuración' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];