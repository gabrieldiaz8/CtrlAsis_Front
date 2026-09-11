import { Component, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideAngularModule, Search, HelpCircle, Menu, X, User, LogOut, ChevronDown, Sun, Moon } from 'lucide-angular';
import { CommonModule } from '@angular/common';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ReactiveFormsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  private router = inject(Router);
  readonly themeService = inject(ThemeService);

  sidebarCollapsed = input(false);
  pageTitle = input('Métricas Generales');
  userName = input('Administrador');
  userRole = input('Usuario');
  userAvatar = input('');

  toggleSidebar = output<void>();
  logout = output<void>();

  readonly Search = Search;
  readonly HelpCircle = HelpCircle;
  readonly Menu = Menu;
  readonly X = X;
  readonly User = User;
  readonly LogOut = LogOut;
  readonly ChevronDown = ChevronDown;
  readonly Sun = Sun;
  readonly Moon = Moon;

  showProfileMenu = signal(false);

  searchControl = new FormControl('');

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  onLogout() {
    this.logout.emit();
    this.showProfileMenu.set(false);
  }

  toggleProfileMenu() {
    this.showProfileMenu.update(v => !v);
  }

  buscar() {
    const q = (this.searchControl.value || '').trim();
    this.router.navigate(['/socios'], { queryParams: q ? { q } : {} });
  }

  onQuickCheckin() {
    this.router.navigate(['/acceso']);
  }
}