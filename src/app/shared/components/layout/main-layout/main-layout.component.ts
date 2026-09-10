import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

interface UserData {
  email?: string;
  rol?: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  pageTitle = signal('Métricas Generales');

  private userData: UserData | null = (() => {
    try {
      return JSON.parse(localStorage.getItem('user_data') || 'null') as UserData | null;
    } catch {
      return null;
    }
  })();

  userName = signal(this.userData?.email || 'Usuario');
  userRole = signal(this.formatRole(this.userData?.rol));

  onToggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  onLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');
    this.router.navigate(['/login']);
  }

  setPageTitle(title: string) {
    this.pageTitle.set(title);
  }

  private formatRole(rol?: string): string {
    if (!rol) return 'Usuario';
    const labels: Record<string, string> = {
      super_admin: 'Super Admin',
      dueno: 'Dueño',
      administrador: 'Administrador',
      recepcionista: 'Recepcionista'
    };
    return labels[rol] || rol;
  }
}