import { Component, computed, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LayoutDashboard, DoorOpen, Users, Calendar, CreditCard, Settings, Plus, LogOut, User } from 'lucide-angular';

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
  collapsed = input(false);
  userName = input('Administrador de FitFlow');
  userRole = input('Administrador');

  readonly LayoutDashboard = LayoutDashboard;
  readonly DoorOpen = DoorOpen;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly CreditCard = CreditCard;
  readonly Settings = Settings;
  readonly Plus = Plus;
  readonly LogOut = LogOut;
  readonly User = User;

  navItems = signal<NavItem[]>([
    { label: 'Control de Acceso', icon: DoorOpen, route: '/acceso' },
    { label: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
    { label: 'Socios', icon: Users, route: '/socios' },
    { label: 'Planes', icon: Calendar, route: '/planes' },
    { label: 'Pagos', icon: CreditCard, route: '/pagos' },
    { label: 'Configuración', icon: Settings, route: '/configuracion' }
  ]);

  onLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}