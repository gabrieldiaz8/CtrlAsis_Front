import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, DoorOpen, Users, Calendar, CreditCard, Settings, Plus, LogOut, User, BadgeCheck, Tags } from 'lucide-angular';
import { RoleService } from '@core/services/role.service';
import { HasRoleDirective } from '@core/directives/has-role.directive';

interface NavItem {
  label: string;
  icon: any;
  route: string;
  module: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, HasRoleDirective],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private router = inject(Router);
  private roleService = inject(RoleService);

  collapsed = input(false);
  userName = input('Usuario');
  userRole = input('Usuario');

  readonly LayoutDashboard = LayoutDashboard;
  readonly DoorOpen = DoorOpen;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly CreditCard = CreditCard;
  readonly Settings = Settings;
  readonly Plus = Plus;
  readonly LogOut = LogOut;
  readonly User = User;
  readonly BadgeCheck = BadgeCheck;
  readonly Tags = Tags;

  private readonly baseNav: NavItem[] = [
    { label: 'Control de Acceso', icon: DoorOpen, route: '/acceso', module: 'acceso' },
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', module: 'dashboard' },
    { label: 'Socios', icon: Users, route: '/socios', module: 'socios' },
    { label: 'Planes', icon: Calendar, route: '/planes', module: 'planes' },
    { label: 'Membresías', icon: BadgeCheck, route: '/membresias', module: 'membresias' },
    { label: 'Pagos', icon: CreditCard, route: '/pagos', module: 'pagos' },
    { label: 'Catálogos', icon: Tags, route: '/catalogos', module: 'catalogos' },
    { label: 'Configuración', icon: Settings, route: '/configuracion', module: 'configuracion' }
  ];

  navItems = computed(() =>
    this.baseNav.filter(item => this.roleService.canAccessModule(item.module))
  );

  onLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    this.router.navigate(['/login']);
  }
}