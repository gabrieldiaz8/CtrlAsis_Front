import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed } from '@angular/core';
import { LucideAngularModule, Plus, Search, Filter, ChevronLeft, ChevronRight, Loader2, CreditCard, DollarSign, Calendar, User, Eye, ArrowLeft, ArrowRight, X, CheckCircle, Download, ChevronUp, ChevronDown, Wallet, Landmark, Receipt, RefreshCw } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { PagosService, PagoResponseDto } from '@api';
import { SociosService, SocioResponseDto } from '@api';
import { CatalogosService, MedioPagoResponseDto } from '@api';
import { PagoFormModalComponent } from '@shared/components';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { modalOverlay, modalPanel, staggerGrid } from '@shared/utils/animations';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

type SortColumn = 'fecha' | 'socio' | 'plan' | 'medio' | 'monto';

@Component({
  selector: 'app-pagos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule, PagoFormModalComponent],
  animations: [staggerGrid, modalOverlay, modalPanel],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.css'
})
export class PagosComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private pagosService = inject(PagosService);
  private sociosService = inject(SociosService);
  private catalogosService = inject(CatalogosService);
  private toast = inject(ToastService);

  private socioFiltroSearch$ = new Subject<string>();
  private socioFiltroRequest: Subscription | null = null;

  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Loader2 = Loader2;
  readonly CreditCard = CreditCard;
  readonly DollarSign = DollarSign;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly Eye = Eye;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Download = Download;
  readonly ChevronUp = ChevronUp;
  readonly ChevronDown = ChevronDown;
  readonly Wallet = Wallet;
  readonly Landmark = Landmark;
  readonly Receipt = Receipt;
  readonly RefreshCw = RefreshCw;

  // Datos
  pagos = signal<PagoResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filtros
  searchTerm = signal('');
  filtroMedios = signal<string[]>([]);
  filtroSocio = signal<SocioResponseDto | null>(null);
  socioQuery = signal('');
  socioResults = signal<SocioResponseDto[]>([]);
  socioSearching = signal(false);
  mediosPago = signal<MedioPagoResponseDto[]>([]);

  // Orden
  sortColumn = signal<SortColumn>('fecha');
  sortDir = signal<'asc' | 'desc'>('desc');

  // Paginación
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);

  // Registro / detalle
  showRegistro = signal(false);
  registroSocio = signal<SocioResponseDto | null>(null);
  showDetail = signal(false);
  detailPago = signal<PagoResponseDto | null>(null);
  detailLoading = signal(false);
  detailError = signal<string | null>(null);

  constructor() {
    this.socioFiltroSearch$
      .pipe(takeUntilDestroyed(), debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchSociosFiltro(term));
  }

  ngOnInit() {
    this.layout.setPageTitle('Pagos');
    this.loadMediosPago();
    this.loadPagos();
  }

  loadMediosPago() {
    this.catalogosService.catalogosControllerFindAllMediosPago().subscribe({
      next: (data) => this.mediosPago.set(data || []),
      error: () => console.error('Error loading medios de pago')
    });
  }

  loadPagos() {
    this.loading.set(true);
    this.error.set(null);

    this.pagosService.pagosControllerFindAll(
      undefined,
      this.filtroSocio()?.id || undefined,
      this.pageSize,
      this.currentPage() - 1
    ).subscribe({
      next: (response) => {
        this.pagos.set(response.data || []);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los pagos');
        this.loading.set(false);
        this.toast.error('No se pudieron cargar los pagos', { title: 'Error' });
        console.error('Error loading pagos:', err);
      }
    });
  }

  // ------------------------------------------------------------
  // Filtros
  // ------------------------------------------------------------
  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  isMedioSelected(id: string): boolean {
    return this.filtroMedios().includes(id);
  }

  toggleMedio(id: string) {
    const current = this.filtroMedios();
    if (current.includes(id)) {
      this.filtroMedios.set(current.filter((m) => m !== id));
    } else {
      this.filtroMedios.set([...current, id]);
    }
    this.currentPage.set(1);
  }

  onSocioFiltroInput(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    this.socioQuery.set(term);
    if (!term.trim()) {
      this.socioResults.set([]);
      return;
    }
    this.socioFiltroSearch$.next(term);
  }

  searchSociosFiltro(term: string) {
    this.socioSearching.set(true);
    this.socioFiltroRequest?.unsubscribe();
    this.socioFiltroRequest = this.sociosService.sociosControllerFindAll(undefined, undefined, undefined, term, undefined, undefined, 6, 1).subscribe({
      next: (response) => {
        this.socioResults.set((response.data || []) as SocioResponseDto[]);
        this.socioSearching.set(false);
      },
      error: () => this.socioSearching.set(false)
    });
  }

  selectSocioFiltro(socio: SocioResponseDto) {
    this.filtroSocio.set(socio);
    this.socioQuery.set(`${socio.nombre} ${socio.apellido}`);
    this.socioResults.set([]);
    this.currentPage.set(1);
    this.loadPagos();
  }

  clearSocioFiltro() {
    this.filtroSocio.set(null);
    this.socioQuery.set('');
    this.socioResults.set([]);
    this.currentPage.set(1);
    this.loadPagos();
  }

  hasActiveFilters = computed(() =>
    !!this.searchTerm() ||
    this.filtroMedios().length > 0 ||
    !!this.filtroSocio()
  );

  clearFilters() {
    this.searchTerm.set('');
    this.filtroMedios.set([]);
    this.filtroSocio.set(null);
    this.socioQuery.set('');
    this.socioResults.set([]);
    this.currentPage.set(1);
    this.loadPagos();
  }

  // ------------------------------------------------------------
  // Orden
  // ------------------------------------------------------------
  onSort(col: SortColumn) {
    if (this.sortColumn() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDir.set(col === 'monto' ? 'desc' : 'asc');
    }
  }

  // ------------------------------------------------------------
  // Filas filtradas / totalizador
  // ------------------------------------------------------------
  filteredPagos = computed(() => {
    let result = this.pagos();

    const medios = this.filtroMedios();
    if (medios.length > 0) {
      result = result.filter((p) => medios.includes(p.medioPagoId));
    }

    const term = this.searchTerm().toLowerCase();
    if (term) {
      result = result.filter((p) =>
        p.socioNombre?.toLowerCase().includes(term) ||
        p.socioDni?.toLowerCase().includes(term) ||
        p.planNombre?.toLowerCase().includes(term) ||
        p.medioPagoNombre?.toLowerCase().includes(term)
      );
    }

    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const col = this.sortColumn();
    return [...result].sort((a, b) => {
      switch (col) {
        case 'fecha': return (a.fechaPago || '').localeCompare(b.fechaPago || '') * dir;
        case 'socio': return (a.socioNombre || '').localeCompare(b.socioNombre || '') * dir;
        case 'plan': return (a.planNombre || '').localeCompare(b.planNombre || '') * dir;
        case 'medio': return (a.medioPagoNombre || '').localeCompare(b.medioPagoNombre || '') * dir;
        case 'monto': return ((a.monto ?? 0) - (b.monto ?? 0)) * dir;
        default: return 0;
      }
    });
  });

  totalFiltrado = computed(() =>
    this.filteredPagos().reduce((acc, p) => acc + (p.monto ?? 0), 0)
  );

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

  onPageChange(page: number) {
    if (page === -1 || page === -2) return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPagos();
    }
  }

  // ------------------------------------------------------------
  // Registro / detalle
  // ------------------------------------------------------------
  openRegistro() {
    this.registroSocio.set(null);
    this.showRegistro.set(true);
  }

  onPagoSaved() {
    this.loadPagos();
  }

  openDetail(pago: PagoResponseDto) {
    this.showDetail.set(true);
    this.detailLoading.set(true);
    this.detailError.set(null);
    this.detailPago.set(pago);

    this.pagosService.pagosControllerFindOne(pago.id).subscribe({
      next: (detalle) => {
        this.detailPago.set(detalle);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailError.set('No se pudo cargar el detalle del pago');
        this.detailLoading.set(false);
        console.error('Error loading pago detail:', err);
      }
    });
  }

  closeDetail() {
    this.showDetail.set(false);
    this.detailPago.set(null);
  }

  // ------------------------------------------------------------
  // Export CSV
  // ------------------------------------------------------------
  exportCSV() {
    const rows = this.filteredPagos();
    if (rows.length === 0) {
      this.toast.warning('No hay pagos que coincidan con los filtros', { title: 'Exportar' });
      return;
    }

    const header = ['Fecha', 'Socio', 'DNI', 'Plan', 'Medio de pago', 'Monto'];
    const lines = rows.map((p) =>
      [this.formatDate(p.fechaPago), p.socioNombre, p.socioDni, p.planNombre, p.medioPagoNombre, p.monto.toFixed(2)]
        .map((f) => `"${String(f).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = '\uFEFF' + [header.join(','), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagos_${this.today()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.toast.success(`${rows.length} pagos exportados`, { title: 'Exportado' });
  }

  // ------------------------------------------------------------
  // Helpers visuales
  // ------------------------------------------------------------
  getMedioPagoIcon(nombre: string): any {
    const lower = nombre?.toLowerCase() || '';
    if (lower.includes('efectivo')) return this.DollarSign;
    if (lower.includes('tarjeta')) return this.CreditCard;
    if (lower.includes('transfer')) return this.Landmark;
    if (lower.includes('mercado')) return this.Wallet;
    return this.Receipt;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
  }

  formatMoney(monto: number | undefined): string {
    if (monto == null) return '';
    return '$ ' + monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected readonly Math = Math;
}