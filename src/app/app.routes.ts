import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard], title: 'Dashboard' },
      { path: 'acceso', loadComponent: () => import('./features/acceso/acceso.component').then(m => m.AccesoComponent), canActivate: [authGuard], title: 'Control de Acceso' },
      { path: 'socios', loadComponent: () => import('./features/socios/socios.component').then(m => m.SociosComponent), canActivate: [authGuard], title: 'Socios' },
      { path: 'planes', loadComponent: () => import('./features/planes/planes.component').then(m => m.PlanesComponent), canActivate: [authGuard], title: 'Planes' },
      { path: 'membresias', loadComponent: () => import('./features/membresias/membresias.component').then(m => m.MembresiasComponent), canActivate: [authGuard], title: 'Membresías' },
      { path: 'pagos', loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent), canActivate: [authGuard], title: 'Pagos' },
      { path: 'catalogos', loadComponent: () => import('./features/catalogos/catalogos.component').then(m => m.CatalogosComponent), canActivate: [authGuard], title: 'Catálogos' },
      { path: 'configuracion', loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent), canActivate: [authGuard], title: 'Configuración' }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Login' },
  { path: '**', redirectTo: 'login' }
];