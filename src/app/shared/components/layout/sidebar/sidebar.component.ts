import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, DoorOpen, Users, CreditCard, Settings, LogOut, User, BadgeCheck, Store, Sun, Moon } from 'lucide-angular';
import { RolUsuario, RoleService } from '@core/services/role.service';
import { ThemeService } from '@core/services/theme.service';

interface NavItem {
  label: string;
  icon: any;
  route: string;
  roles: RolUsuario[];
}

const OPERACION: RolUsuario[] = ['recepcionista', 'administrador', 'dueno'];
const CON_METRICAS: RolUsuario[] = ['administrador', 'dueno'];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private router = inject(Router);
  private roleService = inject(RoleService);
  readonly themeService = inject(ThemeService);

  collapsed = input(false);
  userName = input('Usuario');
  userRole = input('Usuario');

  readonly LayoutDashboard = LayoutDashboard;
  readonly DoorOpen = DoorOpen;
  readonly Users = Users;
  readonly CreditCard = CreditCard;
  readonly Settings = Settings;
  readonly LogOut = LogOut;
  readonly User = User;
  readonly BadgeCheck = BadgeCheck;
  readonly Store = Store;
  readonly Sun = Sun;
  readonly Moon = Moon;

  /**
   * Configuración es exclusiva del super_admin: administra la plataforma
   * (negocios, planes, catálogos y usuarios). Para el resto de los roles la
   * ruta sigue existiendo, pero `roleGuard` los devuelve a su pantalla inicial.
   */
  private readonly baseNav: NavItem[] = [
    { label: 'Control de Acceso', icon: DoorOpen, route: '/acceso', roles: OPERACION },
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard', roles: CON_METRICAS },
    { label: 'Socios', icon: Users, route: '/socios', roles: OPERACION },
    { label: 'Pagos', icon: CreditCard, route: '/pagos', roles: OPERACION },
    { label: 'Configuración', icon: Settings, route: '/configuracion', roles: ['super_admin'] }
  ];

  navItems = computed(() =>
    this.baseNav.filter(item => this.roleService.hasAnyRole(item.roles))
  );

  onLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    this.router.navigate(['/login']);
  }
}