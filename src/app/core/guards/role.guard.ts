import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService, RolUsuario } from '@core/services/role.service';
import { ToastService } from '@core/services/toast.service';

export const roleGuard: CanActivateFn = (route) => {
  const roleService = inject(RoleService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const roles = route.data?.['roles'] as RolUsuario[] | undefined;
  const module = route.data?.['module'] as string | undefined;

  const allowed = roles !== undefined
    ? roleService.hasAnyRole(roles)
    : module !== undefined
      ? roleService.canAccessModule(module)
      : true;

  if (allowed) return true;

  toast.warning('Su rol no tiene permisos para acceder a esta sección.', {
    title: 'Acceso restringido'
  });
  router.navigateByUrl(roleService.homeRoute());
  return false;
};