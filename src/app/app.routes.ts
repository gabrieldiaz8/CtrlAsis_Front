import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/components/layout';
import { RoleService } from '@core/services/role.service';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: () => inject(RoleService).homeRoute() },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), canActivate: [authGuard, roleGuard], data: { module: 'dashboard', preload: true, preloadDelay: 0 }, title: 'Dashboard' },
      { path: 'acceso', loadComponent: () => import('./features/acceso/acceso.component').then(m => m.AccesoComponent), canActivate: [authGuard, roleGuard], data: { module: 'acceso', preload: true, preloadDelay: 250 }, title: 'Control de Acceso' },
      { path: 'socios', loadComponent: () => import('./features/socios/socios.component').then(m => m.SociosComponent), canActivate: [authGuard, roleGuard], data: { module: 'socios', preload: true, preloadDelay: 500 }, title: 'Socios' },
      { path: 'pagos', loadComponent: () => import('./features/pagos/pagos.component').then(m => m.PagosComponent), canActivate: [authGuard, roleGuard], data: { module: 'pagos', preload: true, preloadDelay: 1400 }, title: 'Pagos' },
      { path: 'membresias', redirectTo: '/socios' },
      { path: 'planes', redirectTo: '/configuracion', pathMatch: 'full' },
      { path: 'catalogos', redirectTo: '/configuracion', pathMatch: 'full' },
      { path: 'configuracion', loadComponent: () => import('./features/configuracion/configuracion.component').then(m => m.ConfiguracionComponent), canActivate: [authGuard, roleGuard], data: { module: 'configuracion' }, title: 'Configuración' }
    ]
  },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), title: 'Login' },
  { path: '**', redirectTo: 'login' }
];