import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, DoorOpen, Users, Calendar, CreditCard, Settings, Plus, LogOut, User, BadgeCheck, Tags } from 'lucide-angular';

interface NavItem {
  label: string;
  icon: any;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  private router = inject(Router);

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

  navItems = signal<NavItem[]>([
    { label: 'Control de Acceso', icon: DoorOpen, route: '/acceso' },
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
    { label: 'Socios', icon: Users, route: '/socios' },
    { label: 'Planes', icon: Calendar, route: '/planes' },
    { label: 'Membresías', icon: BadgeCheck, route: '/membresias' },
    { label: 'Pagos', icon: CreditCard, route: '/pagos' },
    { label: 'Catálogos', icon: Tags, route: '/catalogos' },
    { label: 'Configuración', icon: Settings, route: '/configuracion' }
  ]);

  onLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    this.router.navigate(['/login']);
  }
}