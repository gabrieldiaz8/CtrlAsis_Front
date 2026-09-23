import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/layout';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard, roleGuard], data: { module: 'dashboard', preload: true, preloadDelay: 0 }, title: 'Dashboard' },
      { path: 'acceso', loadComponent: () => import('./features/acceso/acceso.component').then(m => m.AccesoComponent), canActivate: [authGuard, roleGuard], data: { module: 'acceso', preload: true, preloadDelay: 250 }, title: 'Control de Acceso' },
      { path: 'socios', loadComponent: () => import('./features/socios/socios.component').then(m => m.SociosComponent), canActivate: [authGuard, roleGuard], data: { module: 'socios', preload: true, preloadDelay: 500 }, title: 'Socios' },
      { path: 'planes', loadComponent: () => import('./features/planes/planes.component').then(m => m.PlanesComponent), canActivate: [authGuard, roleGuard], data: { module: 'planes', preload: true, preloadDelay: 1000 }, title: 'Planes' },
      { path: 'membresias', loadComponent: () => import('./features/membresias/membresias.component').then(m => m.MembresiasComponent), canActivate: [authGuard, roleGuard], data: { module: 'membresias', preload: true, preloadDelay: 1200 }, title: 'Membresías' },
      { path: 'pagos', loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent), canActivate: [authGuard, roleGuard], data: { module: 'pagos', preload: true, preloadDelay: 1400 }, title: 'Pagos' },
      { path: 'catalogos', loadComponent: () => import('./features/catalogos/catalogos.component').then(m => m.CatalogosComponent), canActivate: [authGuard, roleGuard], data: { module: 'catalogos' }, title: 'Catálogos' },
      { path: 'configuracion', loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent), canActivate: [authGuard, roleGuard], data: { module: 'configuracion' }, title: 'Configuración' }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Login' },
  { path: '**', redirectTo: 'login' }
];