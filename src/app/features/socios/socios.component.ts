import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { LucideAngularModule, Users, Search, Filter, Plus, MoreVertical, ChevronLeft, ChevronRight, User, Mail, Calendar, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { SociosService, SocioResponseDto } from '@api';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-socios',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, DatePipe],
  templateUrl: './socios.component.html',
  styleUrl: './socios.component.css'
})
export class SociosComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private sociosService = inject(SociosService);

  readonly Users = Users;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Plus = Plus;
  readonly MoreVertical = MoreVertical;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly User = User;
  readonly Mail = Mail;
  readonly Calendar = Calendar;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Loader2 = Loader2;

  socios = signal<SocioResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);

  ngOnInit() {
    this.layout.setPageTitle('Socios');
    this.loadSocios();
  }

  loadSocios() {
    this.loading.set(true);
    this.error.set(null);
    
    this.sociosService.sociosControllerFindAll(undefined, undefined, undefined, undefined, this.pageSize, this.currentPage() - 1).subscribe({
      next: (response) => {
        this.socios.set(response.content || response);
        this.totalItems.set(response.totalElements || response.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los socios');
        this.loading.set(false);
        console.error('Error loading socios:', err);
      }
    });
  }

  filteredSocios = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.socios().filter(s =>
      s.nombre?.toLowerCase().includes(term) ||
      s.apellido?.toLowerCase().includes(term) ||
      s.dni?.includes(term) ||
      (s as any).email?.toLowerCase().includes(term)
    );
  });

  paginatedSocios = computed(() => {
    const filtered = this.filteredSocios();
    const start = (this.currentPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredSocios().length / this.pageSize));

  getPageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 2) pages.push(-2);
      pages.push(total);
    }
    return pages;
  });

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  }

  getAvatarColor(id: string): string {
    const numId = parseInt(id, 10) || 0;
    const colors = ['bg-primary-fixed-dim text-on-primary-fixed-variant', 'bg-secondary-container text-on-secondary-container', 'bg-tertiary-container text-on-tertiary-container'];
    return colors[numId % colors.length];
  }

  getEstadoBadge(estado: string): { class: string, icon: any, label: string } {
    switch (estado) {
      case 'ACTIVO':
        return { class: 'bg-[#D1FAE5] text-[#065F46] border border-[#34D399]', icon: CheckCircle, label: 'Activo' };
      case 'VENCIDO':
        return { class: 'bg-error-container text-on-error-container border border-[#FCA5A5]', icon: XCircle, label: 'Vencido' };
      case 'SUSPENDIDO':
        return { class: 'bg-surface-variant text-on-surface-variant border border-outline-variant', icon: AlertCircle, label: 'Suspendido' };
      default:
        return { class: 'bg-surface-container-high text-on-surface-variant border border-outline-variant', icon: AlertCircle, label: estado };
    }
  }

  formatFecha(fecha: Date | string | undefined): string {
    if (!fecha) return 'Nunca';
    const date = new Date(fecha);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return diffDays === 1 ? 'Ayer' : `Hace ${diffDays} días`;
    if (diffHours > 0) return `Hace ${diffHours}h`;
    if (diffMinutes > 0) return `Hace ${diffMinutes}m`;
    return 'Hace un momento';
  }

  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    if (page === -1 || page === -2) return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadSocios();
    }
  }

  onNuevoSocio() {
    console.log('Nuevo socio');
  }

  onEditSocio(socio: SocioResponseDto) {
    console.log('Editar socio', socio);
  }

  onDeleteSocio(socio: SocioResponseDto) {
    if (confirm(`¿Eliminar a ${socio.nombre} ${socio.apellido}?`)) {
      console.log('Eliminar socio', socio.id);
    }
  }

  protected readonly Math = Math;
}