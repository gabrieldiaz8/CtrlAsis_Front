import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { RoleService, RolUsuario } from '@core/services/role.service';

@Directive({
  selector: '[hasRole]',
  standalone: true
})
export class HasRoleDirective {
  private readonly roleService = inject(RoleService);
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly hasRole = input<RolUsuario[]>([], { alias: 'hasRole' });

  private rendered = false;

  constructor() {
    effect(() => {
      this.roleService.currentUserRole();
      this.update();
    });
  }

  private update(): void {
    const allowed = this.roleService.hasAnyRole(this.hasRole());
    if (allowed && !this.rendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.rendered = true;
    } else if (!allowed && this.rendered) {
      this.viewContainer.clear();
      this.rendered = false;
    }
  }
}