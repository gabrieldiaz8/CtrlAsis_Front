import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Subject, Observable, debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';
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
  private route = inject(ActivatedRoute);

  private search$ = new Subject<string>();

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

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadSocios();
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {
      const q = (params.get('q') ?? '').trim();
      this.searchTerm.set(q);
      this.search$.next(q);
    });
  }

  loadSocios() {
    const term = this.searchTerm().trim();
    const isNumeric = /^\d+$/.test(term);
    const page = this.currentPage() - 1;

    this.loading.set(true);
    this.error.set(null);

    let request: Observable<any>;

    if (isNumeric) {
      request = this.sociosService.sociosControllerFindAll(term, undefined, undefined, undefined, this.pageSize, page);
    } else if (term) {
      request = forkJoin({
        nombres: this.sociosService.sociosControllerFindAll(undefined, term, undefined, undefined, this.pageSize, page),
        apellidos: this.sociosService.sociosControllerFindAll(undefined, undefined, term, undefined, this.pageSize, page),
      }).pipe(
        map(({ nombres, apellidos }) => {
          const byId = new Map<string, SocioResponseDto>();
          for (const s of [...(nombres.data || []), ...(apellidos.data || [])]) {
            byId.set(s.id, s);
          }
          const data = [...byId.values()].sort(
            (a, b) => (a.apellido || '').localeCompare(b.apellido || '') || (a.nombre || '').localeCompare(b.nombre || '')
          );
          return { data, total: data.length };
        })
      );
    } else {
      request = this.sociosService.sociosControllerFindAll(undefined, undefined, undefined, undefined, this.pageSize, page);
    }

    request.subscribe({
      next: (response) => {
        this.socios.set(response.data || response);
        this.totalItems.set(response.total ?? response.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los socios');
        this.loading.set(false);
        console.error('Error loading socios:', err);
      }
    });
  }

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize));

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
        return { class: 'bg-success-container text-on-success-container border border-success', icon: CheckCircle, label: 'Activo' };
      case 'VENCIDO':
        return { class: 'bg-error-container text-on-error-container border border-error', icon: XCircle, label: 'Vencido' };
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
    this.search$.next(this.searchTerm());
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