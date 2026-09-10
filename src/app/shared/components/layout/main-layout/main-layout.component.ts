import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NavbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  sidebarCollapsed = signal(false);
  pageTitle = signal('Métricas Generales');
  userName = signal('Administrador de FitFlow');
  userRole = signal('Administrador');

  onToggleSidebar() {
    this.sidebarCollapsed.update(v => !v);
  }

  onLogout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  setPageTitle(title: string) {
    this.pageTitle.set(title);
  }
}