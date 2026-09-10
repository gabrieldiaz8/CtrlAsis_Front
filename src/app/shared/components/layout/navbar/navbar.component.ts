import { Component, input, output, signal } from '@angular/core';
import { LucideAngularModule, Search, Bell, HelpCircle, Menu, X, User, LogOut, ChevronDown } from 'lucide-angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  sidebarCollapsed = input(false);
  pageTitle = input('Métricas Generales');
  userName = input('Administrador');
  userAvatar = input('');

  toggleSidebar = output<void>();
  logout = output<void>();

  readonly Search = Search;
  readonly Bell = Bell;
  readonly HelpCircle = HelpCircle;
  readonly Menu = Menu;
  readonly X = X;
  readonly User = User;
  readonly LogOut = LogOut;
  readonly ChevronDown = ChevronDown;

  showProfileMenu = signal(false);
  showNotifications = signal(false);

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

  toggleNotifications() {
    this.showNotifications.update(v => !v);
  }
}