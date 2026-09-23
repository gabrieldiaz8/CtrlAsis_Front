import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UsuarioResponseDto } from '@api/model/usuarioResponseDto';

export type RolUsuario = UsuarioResponseDto.RolEnum;

export type AppModule =
  | 'acceso'
  | 'dashboard'
  | 'socios'
  | 'planes'
  | 'membresias'
  | 'pagos'
  | 'catalogos'
  | 'configuracion'
  | 'usuarios';

const ALL_ROLES: RolUsuario[] = ['recepcionista', 'administrador', 'dueno', 'super_admin'];

const ROLE_LEVEL: Record<RolUsuario, number> = {
  recepcionista: 1,
  administrador: 2,
  dueno: 3,
  super_admin: 4
};

const ROLE_LABELS: Record<RolUsuario, string> = {
  recepcionista: 'Recepcionista',
  administrador: 'Administrador',
  dueno: 'Dueño',
  super_admin: 'Super Admin'
};

const MODULE_ACCESS: Record<AppModule, RolUsuario[]> = {
  acceso: ALL_ROLES,
  dashboard: ALL_ROLES,
  socios: ALL_ROLES,
  pagos: ALL_ROLES,
  membresias: ['administrador', 'dueno', 'super_admin'],
  planes: ['administrador', 'dueno', 'super_admin'],
  catalogos: ['dueno', 'super_admin'],
  configuracion: ['dueno', 'super_admin'],
  usuarios: ['dueno', 'super_admin']
};

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentUserRole = signal<RolUsuario | null>(null);

  readonly currentUserId = signal<string | null>(null);

  constructor() {
    this.refresh();
  }

  refresh(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    let rol: RolUsuario | null = null;
    let userId: string | null = null;
    try {
      const raw = JSON.parse(localStorage.getItem('user_data') || 'null');
      rol = this.normalizeRole(raw?.rol);
      userId = typeof raw?.id === 'string' && raw.id.length > 0 ? raw.id : null;
    } catch {
      rol = null;
      userId = null;
    }
    this.currentUserRole.set(rol);
    this.currentUserId.set(userId);
  }

  hasRole(role: RolUsuario): boolean {
    return this.currentUserRole() === role;
  }

  hasAnyRole(roles: RolUsuario[]): boolean {
    const role = this.currentUserRole();
    return role !== null && roles.includes(role);
  }

  canAccessModule(module: string): boolean {
    const roles = MODULE_ACCESS[module as AppModule];
    return roles ? this.hasAnyRole(roles) : false;
  }

  roleLevel(): number {
    const role = this.currentUserRole();
    return role ? ROLE_LEVEL[role] : 0;
  }

  roleLabel(): string {
    const role = this.currentUserRole();
    return role ? ROLE_LABELS[role] : 'Usuario';
  }

  private normalizeRole(value: unknown): RolUsuario | null {
    return typeof value === 'string' && ALL_ROLES.includes(value as RolUsuario)
      ? (value as RolUsuario)
      : null;
  }
}