import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, HostListener, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Subject, Observable, Subscription, debounceTime, distinctUntilChanged, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { LucideAngularModule, Users, Search, Filter, Plus, MoreVertical, ChevronLeft, ChevronRight, User, Mail, Calendar, AlertCircle, CheckCircle, XCircle, Loader2, X, Eye, CreditCard, Shield, RefreshCw, Clock, RotateCcw, Wallet, DollarSign, Landmark, Receipt, CalendarClock, CircleSlash, Ban, PauseCircle, LucideIconData } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import {
  SociosService,
  SocioResponseDto,
  CreateSocioDto,
  UpdateSocioDto,
  ConteosEstadoMembresiaDto,
} from '@api';
import { MembresiasService, MembresiaResponseDto, CreateMembresiaDto, RenovarMembresiaDto } from '@api';
import { PlanesMembresiaService, PlanMembresiaResponseDto } from '@api';
import { PagosService, PagoResponseDto, CreatePagoDto } from '@api';
import { CatalogosService, MedioPagoResponseDto } from '@api';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { HasRoleDirective } from '@core/directives/has-role.directive';
import { PagoFormModalComponent, PlanMembresiaFieldsComponent } from '@shared/components';
import { MembresiaActualComponent } from './membresia-actual/membresia-actual.component';
import { HistorialMembresiasComponent } from './historial-membresias/historial-membresias.component';
import { ModalRenovarComponent } from './modal-renovar/modal-renovar.component';
import { ModalCancelarComponent } from './modal-cancelar/modal-cancelar.component';
import { modalOverlay, modalPanel, staggerGrid } from '@shared/utils/animations';

/** Paso del alta de socio con membresía que se está ejecutando o que falló. */
type AltaPaso = 'socio' | 'membresia' | 'pago';

/**
 * Los mismos valores que acepta el query param `estadoMembresia` del backend, que
 * a su vez son las claves de `ConteosEstadoMembresiaDto`. Un solo vocabulario para
 * chip, conteo y request: si hay que mapear entre listas, en algún momento se
 * desincroniza.
 */
type EstadoMembresiaFiltro =
  | 'activa'
  | 'vencida'
  | 'suspendida'
  | 'cancelada'
  | 'sin_membresia';

interface ChipMembresia {
  label: string;
  value: EstadoMembresiaFiltro | undefined;
}

@Component({
  selector: 'app-socios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule, ReactiveFormsModule, FormsModule, DatePipe, HasRoleDirective, PagoFormModalComponent, PlanMembresiaFieldsComponent, MembresiaActualComponent, HistorialMembresiasComponent, ModalRenovarComponent, ModalCancelarComponent],
  animations: [staggerGrid, modalOverlay, modalPanel],
  templateUrl: './socios.component.html',
  styleUrl: './socios.component.css'
})
export class SociosComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private sociosService = inject(SociosService);
  private membresiasService = inject(MembresiasService);
  private planesService = inject(PlanesMembresiaService);
  private pagosService = inject(PagosService);
  private catalogosService = inject(CatalogosService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  private search$ = new Subject<string>();
  private sociosRequest: Subscription | null = null;

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
  readonly X = X;
  readonly Eye = Eye;
  readonly CreditCard = CreditCard;
  readonly Shield = Shield;
  readonly RefreshCw = RefreshCw;
  readonly Clock = Clock;
  readonly RotateCcw = RotateCcw;
  readonly Wallet = Wallet;
  readonly DollarSign = DollarSign;
  readonly Landmark = Landmark;
  readonly Receipt = Receipt;
  readonly CalendarClock = CalendarClock;
  readonly CircleSlash = CircleSlash;
  readonly Ban = Ban;
  readonly PauseCircle = PauseCircle;

  socios = signal<SocioResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);

  /** Filtro por estado de la membresía más reciente. `undefined` = Todos. */
  estadoMembresia = signal<EstadoMembresiaFiltro | undefined>(undefined);
  /** Conteos que devuelve el backend según la búsqueda actual. */
  conteosMembresia = signal<ConteosEstadoMembresiaDto | null>(null);

  readonly chipsMembresia: ChipMembresia[] = [
    { label: 'Todos', value: undefined },
    { label: 'Activas', value: 'activa' },
    { label: 'Vencidas', value: 'vencida' },
    { label: 'Suspendidas', value: 'suspendida' },
    { label: 'Canceladas', value: 'cancelada' },
    { label: 'Sin membresía', value: 'sin_membresia' },
  ];

  showModal = signal(false);
  editingSocio = signal<SocioResponseDto | null>(null);
  saving = signal(false);

  socioForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required]],
    apellido: ['', [Validators.required]],
    dni: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    telefono: [''],
    fechaAlta: [this.getToday(), [Validators.required]]
  });

  // Detalle de socio (tab Datos / Membresías / Pagos)
  showSocioDetail = signal(false);
  detailSocio = signal<SocioResponseDto | null>(null);
  detailTab = signal<'datos' | 'membresias' | 'pagos'>('datos');
  socioMembresias = signal<MembresiaResponseDto[]>([]);
  socioMembresiasLoading = signal(false);
  socioMembresiasError = signal<string | null>(null);
  socioMembresiasLoaded = signal(false);
  socioPagos = signal<PagoResponseDto[]>([]);
  socioPagosLoading = signal(false);
  socioPagosError = signal<string | null>(null);
  socioPagosLoaded = signal(false);
  showSocioPagoForm = signal(false);

  // Modales del bloque Membresía en la ficha
  showRenovarModal = signal(false);
  renovarMembresia = signal<MembresiaResponseDto | null>(null);
  showCancelarModal = signal(false);
  cancelarMembresia = signal<MembresiaResponseDto | null>(null);

  totalPagosSocio = computed(() =>
    this.socioPagos().reduce((acc, p) => acc + (p.monto ?? 0), 0)
  );

  // Crear membresía desde la ficha de un socio ya existente
  showSocioMembresiaModal = signal(false);
  socialMembresiaSaving = signal(false);
  membresiaRapidaForm = this.fb.nonNullable.group({
    planId: ['', [Validators.required]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: ['']
  });

  planes = signal<PlanMembresiaResponseDto[]>([]);
  planesActivos = computed(() => this.planes().filter(p => p.activo));

  // ------------------------------------------------------------
  // Alta de socio con membresía (y pago opcional) en el mismo flujo
  // ------------------------------------------------------------
  asignarMembresia = signal(true);
  registrarPago = signal(true);
  mediosPago = signal<MedioPagoResponseDto[]>([]);
  montoPagoTocado = signal(false);

  /** Socio ya creado: a partir de acá el alta NO se vuelve a ejecutar. */
  socioAltaCreado = signal<SocioResponseDto | null>(null);
  membresiaAltaCreada = signal<MembresiaResponseDto | null>(null);
  pagoAltaCreado = signal<PagoResponseDto | null>(null);
  pasoAlta = signal<AltaPaso | null>(null);
  altaError = signal<string | null>(null);

  readonly altaBloqueada = computed(() => this.socioAltaCreado() !== null);
  readonly sinPlanesActivos = computed(() => this.planesActivos().length === 0);

  membresiaForm = this.fb.nonNullable.group({
    planId: ['', [Validators.required]],
    fechaInicio: [this.getToday(), [Validators.required]],
    fechaFin: ['']
  });

  pagoForm = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(1)]],
    medioPagoId: ['', [Validators.required]]
  });

  readonly textoBotonAlta = computed(() => {
    if (this.editingSocio()) return 'Actualizar';
    if (this.altaBloqueada()) {
      return this.membresiaAltaCreada() ? 'Reintentar Pago' : 'Reintentar Membresía';
    }
    if (!this.asignarMembresia()) return 'Crear Socio';
    return this.registrarPago() ? 'Crear Socio, Membresía y Pago' : 'Crear Socio y Membresía';
  });

  readonly textoPasoEnCurso = computed(() => {
    switch (this.pasoAlta()) {
      case 'socio': return 'Creando socio...';
      case 'membresia': return 'Creando membresía...';
      case 'pago': return 'Registrando pago...';
      default: return null;
    }
  });

  readonly textoReintento = computed(() => {
    if (!this.altaBloqueada()) return null;
    return this.membresiaAltaCreada() ? 'el pago' : 'la membresía';
  });

  constructor() {
    this.membresiaForm.get('fechaFin')!.disable({ emitEvent: false });

    this.membresiaForm.get('planId')!
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarPrecioPlan());

    this.membresiaRapidaForm.get('fechaFin')!.disable({ emitEvent: false });
  }

  ngOnInit() {
    this.layout.setPageTitle('Socios');

    this.planesService.planesMembresiaControllerFindAll().subscribe({
      next: (data) => this.planes.set(data || []),
      error: () => console.error('Error loading planes')
    });

    this.catalogosService.catalogosControllerFindAllMediosPago().subscribe({
      next: (data) => {
        this.mediosPago.set(data || []);
        if (!this.pagoForm.getRawValue().medioPagoId && data?.length) {
          this.pagoForm.patchValue({ medioPagoId: data[0].id });
        }
      },
      error: () => console.error('Error loading medios de pago')
    });

    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadSocios();
      });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const q = (params.get('q') ?? '').trim();
      this.searchTerm.set(q);
      this.search$.next(q);
    });
  }

  loadSocios() {
    const term = this.searchTerm().trim();
    // `page` es 1-based (lo que documenta el backend y el default del Swagger).
    // Mandarlo 0-based hacía que la página 2 del listado repitiera la 1.
    const page = this.currentPage();

    this.loading.set(true);
    this.error.set(null);

    const searchParam = term ? term : undefined;

    // dni, nombre, apellido, search, activo, estadoMembresia, limit, page
    const request = this.sociosService.sociosControllerFindAll(
      undefined,
      undefined,
      undefined,
      searchParam,
      undefined,
      this.estadoMembresia(),
      this.pageSize,
      page,
    );

    this.sociosRequest?.unsubscribe();
    this.sociosRequest = request.subscribe({
      next: (response) => {
        this.socios.set(response.data || response);
        this.totalItems.set(response.total ?? 0);
        this.conteosMembresia.set(response.conteosMembresia ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los socios');
        this.loading.set(false);
        this.toast.error('No se pudieron cargar los socios', { title: 'Error' });
        console.error('Error loading socios:', err);
      }
    });
  }

  /** Cambia el chip de estado. Vuelve a la primera página porque el total cambia. */
  onEstadoMembresiaChange(estado: EstadoMembresiaFiltro | undefined) {
    if (this.estadoMembresia() === estado) return;
    this.estadoMembresia.set(estado);
    this.currentPage.set(1);
    this.loadSocios();
  }

  /** Conteo de un chip. 'Todos' usa el total del criterio de búsqueda. */
  conteoChip(estado: EstadoMembresiaFiltro | undefined): number {
    const conteos = this.conteosMembresia();
    if (!conteos) return 0;
    return estado ? (conteos[estado] ?? 0) : (conteos.total ?? 0);
  }

  /**
   * Estado visual del badge de una fila. Devuelve la etiqueta y las clases ya
   * resueltas, para no repetir el ternario de colores en el template.
   *
   * El DTO trae el estado persistido: una membresía puede seguir en 'activa'
   * con la fecha ya pasada, y en la lista figura como vencida. Se recalcula acá
   * con la misma regla que usa el filtro del backend (fecha_fin >= CURRENT_DATE
   * sigue vigente) para que el badge no contradiga al chip que la trajo.
   */
  badgeMembresia(resumen: SocioResponseDto['membresiaResumen']): {
    etiqueta: string;
    clases: string;
    icono: LucideIconData;
  } {
    if (!resumen) {
      return {
        etiqueta: 'Sin membresía',
        clases: 'bg-surface-container-highest text-on-surface-variant border-outline-variant',
        icono: CircleSlash,
      };
    }

    switch (this.estadoEfectivoMembresia(resumen)) {
      case 'activa':
        return {
          etiqueta: 'Activa',
          clases: 'bg-success-container text-on-success-container border-success',
          icono: CheckCircle,
        };
      case 'vencida':
        return {
          etiqueta: 'Vencida',
          clases: 'bg-warning-container text-on-warning-container border-warning',
          icono: CalendarClock,
        };
      case 'suspendida':
        return {
          etiqueta: 'Suspendida',
          clases: 'bg-primary-container text-on-primary-container border-primary',
          icono: PauseCircle,
        };
      default:
        return {
          etiqueta: 'Cancelada',
          clases: 'bg-error-container text-on-error-container border-error',
          icono: Ban,
        };
    }
  }

  /**
   * Estado efectivo de una membresía: el persistido, salvo que siga 'activa'
   * con `fechaFin` ya vencida, en cuyo caso es 'vencida'.
   *
   * `fechaFin` llega como date-only en UTC medianoche; se compara contra el
   * día local para no marcar como vencida una membresía que vence hoy.
   */
  private estadoEfectivoMembresia(
    resumen: NonNullable<SocioResponseDto['membresiaResumen']>,
  ): 'activa' | 'vencida' | 'suspendida' | 'cancelada' {
    if (resumen.estado !== 'activa' || !resumen.fechaFin) return resumen.estado;
    const hoy = new Date();
    const hoyLocal = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return new Date(resumen.fechaFin).getTime() < hoyLocal ? 'vencida' : 'activa';
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
    switch (estado?.toLowerCase()) {
      case 'activo':
      case 'activa':
        return { class: 'bg-success-container text-on-success-container border border-success', icon: CheckCircle, label: 'Activa' };
      case 'vencido':
      case 'vencida':
        return { class: 'bg-error-container text-on-error-container border border-error', icon: XCircle, label: 'Vencida' };
      case 'suspendido':
      case 'suspendida':
        return { class: 'bg-warning-container text-on-warning-container border border-warning-dim', icon: AlertCircle, label: 'Suspendida' };
      case 'cancelada':
        return { class: 'bg-surface-variant text-on-surface-variant border border-outline-variant', icon: X, label: 'Cancelada' };
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
    this.editingSocio.set(null);
    this.socioForm.reset({
      nombre: '',
      apellido: '',
      dni: '',
      telefono: '',
      fechaAlta: this.getToday()
    });
    this.resetAlta();
    this.showModal.set(true);
  }

  onEditSocio(socio: SocioResponseDto) {
    this.editingSocio.set(socio);
    this.socioForm.reset({
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      telefono: socio.telefono || '',
      fechaAlta: socio.fechaAlta?.split('T')[0] || this.getToday()
    });
    this.resetAlta();
    this.showModal.set(true);
  }

  closeModal() {
    // Con el alta en curso no se cierra: si el socio ya quedó creado hay que
    // llegar al final del flujo para no dejar el alta a medias.
    if (this.saving()) return;

    this.showModal.set(false);
    this.editingSocio.set(null);
    this.socioForm.reset();
    this.resetAlta();
  }

  /**
   * Vuelve a foja cero la sección de membresía del alta. Se llama al abrir y al
   * cerrar el modal, así nunca quedan datos de un alta anterior.
   */
  private resetAlta() {
    this.asignarMembresia.set(true);
    this.registrarPago.set(true);
    this.montoPagoTocado.set(false);
    this.socioAltaCreado.set(null);
    this.membresiaAltaCreada.set(null);
    this.pagoAltaCreado.set(null);
    this.pasoAlta.set(null);
    this.altaError.set(null);

    this.setHabilitada(this.membresiaForm, true);
    this.pagoForm.enable({ emitEvent: false });
    this.membresiaForm.reset({ planId: '', fechaInicio: this.getToday(), fechaFin: '' });
    this.pagoForm.reset({ monto: 0, medioPagoId: this.mediosPago()[0]?.id || '' });
  }

  /**
   * Habilita o deshabilita los campos editables del bloque de membresía.
   * `fechaFin` queda siempre deshabilitada: es el valor calculado por el
   * subcomponente compartido y no se edita a mano.
   */
  private setHabilitada(form: FormGroup, habilitada: boolean) {
    for (const nombre of ['planId', 'fechaInicio']) {
      const control = form.get(nombre);
      if (!control) continue;
      habilitada
        ? control.enable({ emitEvent: false })
        : control.disable({ emitEvent: false });
    }
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return;
    if (this.showSocioDetail()) {
      this.closeSocioDetail();
    } else if (this.showSocioMembresiaModal()) {
      this.closeSocioMembresiaModal();
    } else if (this.showModal()) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown() {
    if (this.showSocioPagoForm()) {
      return;
    }
    if (this.showSocioDetail()) {
      this.closeSocioDetail();
    } else if (this.showSocioMembresiaModal()) {
      this.closeSocioMembresiaModal();
    } else if (this.showModal()) {
      this.closeModal();
    }
  }

  // ------------------------------------------------------------
  // Detalle de socio (Datos / Membresías)
  // ------------------------------------------------------------
  openSocioDetail(socio: SocioResponseDto) {
    this.detailSocio.set(socio);
    this.detailTab.set('datos');
    this.showSocioDetail.set(true);
  }

  closeSocioDetail() {
    this.showSocioDetail.set(false);
    this.detailSocio.set(null);
  }

  onDetailTabChange(tab: 'datos' | 'membresias' | 'pagos') {
    this.detailTab.set(tab);
    if (tab === 'membresias' && !this.socioMembresiasLoaded()) {
      this.loadSocioMembresias();
    }
    if (tab === 'pagos' && this.detailSocio() && !this.socioPagosLoaded()) {
      this.loadSocioPagos();
    }
  }

  loadSocioPagos() {
    const socio = this.detailSocio();
    if (!socio) return;

    this.socioPagosLoading.set(true);
    this.socioPagosError.set(null);

    this.pagosService.pagosControllerFindBySocio(String(socio.id)).subscribe({
      next: (pagos) => {
        this.socioPagos.set(pagos || []);
        this.socioPagosLoading.set(false);
        this.socioPagosLoaded.set(true);
      },
      error: (err) => {
        this.socioPagosError.set('No se pudieron cargar los pagos del socio');
        this.socioPagosLoading.set(false);
        console.error('Error loading socio pagos:', err);
      }
    });
  }

  openSocioRegistrarPago() {
    this.showSocioPagoForm.set(true);
  }

  onSocioPagoRegistrado() {
    const socio = this.detailSocio();
    if (!socio) return;
    this.socioPagosLoaded.set(false);
    this.socioPagos.set([]);
    this.loadSocioPagos();
  }

  getMedioIcono(nombre: string): any {
    const lower = nombre?.toLowerCase() || '';
    if (lower.includes('efectivo')) return this.DollarSign;
    if (lower.includes('tarjeta')) return this.CreditCard;
    if (lower.includes('transfer')) return this.Landmark;
    return this.Receipt;
  }

  loadSocioMembresias() {
    const socio = this.detailSocio();
    if (!socio) return;

    this.socioMembresiasLoading.set(true);
    this.socioMembresiasError.set(null);

    this.membresiasService.membresiasControllerFindAll(String(socio.id), undefined, 50, 0).subscribe({
      next: (response) => {
        this.socioMembresias.set(response.data || []);
        this.socioMembresiasLoading.set(false);
        this.socioMembresiasLoaded.set(true);
      },
      error: (err) => {
        this.socioMembresiasError.set('No se pudieron cargar las membresías del socio');
        this.socioMembresiasLoading.set(false);
        console.error('Error loading socio membresias:', err);
      }
    });
  }

  // ------------------------------------------------------------
  // Crear membresía desde el socio
  // ------------------------------------------------------------
  openSocioMembresiaModal() {
    this.setHabilitada(this.membresiaRapidaForm, true);
    this.membresiaRapidaForm.reset({ planId: '', fechaInicio: this.getToday(), fechaFin: '' });
    this.socialMembresiaSaving.set(false);
    this.showSocioMembresiaModal.set(true);
  }

  closeSocioMembresiaModal() {
    if (this.socialMembresiaSaving()) return;
    this.showSocioMembresiaModal.set(false);
    this.membresiaRapidaForm.reset({ planId: '', fechaInicio: this.getToday(), fechaFin: '' });
  }

  crearMembresiaSocio() {
    const socio = this.detailSocio();
    if (!socio) return;

    if (this.membresiaRapidaForm.invalid) {
      this.membresiaRapidaForm.markAllAsTouched();
      this.toast.warning('Seleccioná un plan para la membresía', { title: 'Plan requerido' });
      return;
    }

    this.socialMembresiaSaving.set(true);

    this.membresiasService
      .membresiasControllerCreate(this.buildMembresiaDto(socio.id, this.membresiaRapidaForm))
      .subscribe({
        next: () => {
          this.socialMembresiaSaving.set(false);
          this.closeSocioMembresiaModal();
          this.socioMembresiasLoaded.set(false);
          this.socioMembresias.set([]);
          this.loadSocioMembresias();
          this.toast.success('Membresía creada correctamente', { title: 'Creada' });
        },
        error: (err) => {
          this.socialMembresiaSaving.set(false);
          this.toast.error(err.error?.message || 'Error al crear la membresía', { title: 'Error' });
          console.error('Error creating membresia:', err);
        }
      });
  }

  // ------------------------------------------------------------
  // Bloque Membresía en la ficha: acciones desde subcomponentes
  // ------------------------------------------------------------
  onRenovarMembresia(m: MembresiaResponseDto) {
    this.renovarMembresia.set(m);
    this.showRenovarModal.set(true);
  }

  onRenovado() {
    this.showRenovarModal.set(false);
    this.renovarMembresia.set(null);
    this.socioMembresiasLoaded.set(false);
    this.socioMembresias.set([]);
    this.loadSocioMembresias();
  }

  onCambiarPlanMembresia(m: MembresiaResponseDto) {
    this.renovarMembresia.set(m);
    this.showRenovarModal.set(true);
  }

  onCancelarMembresia(m: MembresiaResponseDto) {
    this.cancelarMembresia.set(m);
    this.showCancelarModal.set(true);
  }

  onCancelado() {
    this.showCancelarModal.set(false);
    this.cancelarMembresia.set(null);
    this.socioMembresiasLoaded.set(false);
    this.socioMembresias.set([]);
    this.loadSocioMembresias();
  }

  onRegistrarPagoMembresia(m: MembresiaResponseDto) {
    this.showSocioPagoForm.set(true);
  }

  onVerPagosMembresia(m: MembresiaResponseDto) {
    this.detailTab.set('pagos');
    this.socioPagosLoaded.set(false);
    this.socioPagos.set([]);
    this.loadSocioPagos();
  }

  onNuevaMembresia() {
    this.openSocioMembresiaModal();
  }

  // ------------------------------------------------------------
  // Helpers de membresías (compartidos con la vista Membresías)
  // ------------------------------------------------------------
  getPlan(planId: string | undefined): PlanMembresiaResponseDto | undefined {
    if (!planId) return undefined;
    return this.planes().find(p => p.id === planId);
  }

  getPlanTipo(planId: string | undefined): string {
    return this.getPlan(planId)?.tipoMembresiaNombre || '—';
  }

  getDiasRestantes(fechaFin: string | Date | undefined): number {
    if (!fechaFin) return 0;
    const fin = new Date(fechaFin);
    fin.setHours(0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffMs = fin.getTime() - hoy.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  isPorVencer(m: MembresiaResponseDto): boolean {
    return m.estado === 'activa' && this.getDiasRestantes(m.fechaFin) <= 7;
  }

  formatMoney(monto: number | undefined): string {
    if (monto == null) return '';
    return '$ ' + monto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatFechaCompleta(fecha: string | Date | null | undefined): string {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  contarMembresiasPorEstado(estado: string): number {
    return this.socioMembresias().filter(m => m.estado === estado).length;
  }

  onSubmitSocio() {
    if (this.socioForm.invalid) {
      this.socioForm.markAllAsTouched();
      return;
    }

    if (this.editingSocio()) {
      this.actualizarSocio(this.editingSocio()!);
      return;
    }

    const errorValidacion = this.validarPasosPendientes();
    if (errorValidacion) {
      this.toast.warning(errorValidacion, { title: 'Revisá los datos' });
      return;
    }

    this.saving.set(true);
    this.altaError.set(null);
    this.bloquearSeccionMembresia(true);

    if (!this.asignarMembresia() && !this.socioAltaCreado()) {
      this.pasoAlta.set('socio');
      this.sociosService.sociosControllerCreate(this.buildSocioDto()).subscribe({
        next: (socio) => {
          this.socioAltaCreado.set(socio);
          this.finalizarAlta();
        },
        error: (err) => this.manejarErrorAlta(err)
      });
      return;
    }

    this.pasoAlta.set(this.pasoPendiente());

    this.continuarAlta().subscribe({
      next: () => this.finalizarAlta(),
      error: (err) => this.manejarErrorAlta(err)
    });
  }

  private actualizarSocio(socio: SocioResponseDto) {
    this.saving.set(true);

    this.sociosService.sociosControllerUpdate(socio.id, this.buildSocioDto() as UpdateSocioDto).subscribe({
      next: () => {
        this.saving.set(false);
        this.loadSocios();
        this.closeModal();
        this.toast.success('Socio actualizado correctamente', { title: 'Actualizado' });
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Error al actualizar el socio', { title: 'Error' });
        console.error('Error updating socio:', err);
      }
    });
  }

  // ------------------------------------------------------------
  // Alta secuencial: socio -> membresía -> pago
  //
  // Cada paso deja rastro en un signal. Si uno falla, el alta NO se reintenta
  // desde cero: el modal queda bloqueado con el socio ya creado y el botón
  // reintenta únicamente el paso que falta, así no se duplica nada.
  // ------------------------------------------------------------

  /** Primer paso del flujo que todavía no se completó. */
  private pasoPendiente(): AltaPaso {
    if (!this.socioAltaCreado()) return 'socio';
    if (!this.membresiaAltaCreada()) return 'membresia';
    return 'pago';
  }

  /** Encadena solo los pasos pendientes, saltando los que ya quedaron hechos. */
  private continuarAlta(): Observable<PagoResponseDto | null> {
    if (this.socioAltaCreado()) {
      return this.encadenarMembresiaYPago(this.fuenteMembresia());
    }

    return this.sociosService.sociosControllerCreate(this.buildSocioDto()).pipe(
      tap(socio => this.socioAltaCreado.set(socio)),
      switchMap(() => this.encadenarMembresiaYPago(this.fuenteMembresia()))
    );
  }

  private fuenteMembresia(): Observable<MembresiaResponseDto> {
    const yaCreada = this.membresiaAltaCreada();
    if (yaCreada) return of(yaCreada);

    this.pasoAlta.set('membresia');
    return this.membresiasService.membresiasControllerCreate(
      this.buildMembresiaDto(this.socioAltaCreado()!.id, this.membresiaForm)
    );
  }

  private encadenarMembresiaYPago(
    membresia$: Observable<MembresiaResponseDto>
  ): Observable<PagoResponseDto | null> {
    return membresia$.pipe(
      tap(membresia => this.membresiaAltaCreada.set(membresia)),
      switchMap(membresia => {
        if (!this.registrarPago()) return of(null);

        const yaCreado = this.pagoAltaCreado();
        if (yaCreado) return of(yaCreado);

        this.pasoAlta.set('pago');
        return this.pagosService.pagosControllerCreate(this.buildPagoDto(membresia.id));
      }),
      tap(pago => { if (pago) this.pagoAltaCreado.set(pago); })
    );
  }

  private finalizarAlta() {
    // El mensaje se arma antes de cerrar el modal: al cerrarlo se resetea el estado del alta.
    const socio = this.socioAltaCreado();
    const conMembresia = this.asignarMembresia();
    const conPago = this.registrarPago();
    const nombre = socio ? `${socio.nombre} ${socio.apellido}` : 'el socio';

    const mensaje = conMembresia
      ? conPago
        ? `Alta completa: ${nombre}, su membresía y su pago quedaron registrados`
        : `Socio ${nombre} y su membresía quedaron registrados`
      : `Socio ${nombre} creado correctamente`;

    this.saving.set(false);
    this.pasoAlta.set(null);
    this.loadSocios();
    this.closeModal();
    this.toast.success(mensaje, { title: 'Alta completa', duration: 6000 });
  }

  private manejarErrorAlta(err: any) {
    this.saving.set(false);
    this.bloquearSeccionMembresia(false);

    const paso = this.pasoAlta();
    const detalle = err?.error?.message;
    const descripcion = this.descripcionDePaso(paso);
    const motivo = detalle || descripcion.fallo;

    this.altaError.set(
      this.socioAltaCreado() ? `${descripcion.participio}: ${motivo}` : motivo
    );

    if (!this.socioAltaCreado()) {
      this.toast.error(motivo, { title: 'Error', duration: 6000 });
      console.error('Error en el alta de socio:', err);
      return;
    }

    const socio = this.socioAltaCreado()!;
    this.toast.error(
      `${socio.nombre} ${socio.apellido} ya quedó creado, pero falló ${descripcion.participio}: ${motivo}. ` +
      `Podés reintentar solo ${descripcion.reintento} desde el mismo formulario.`,
      { title: 'Alta incompleta', duration: 10000 }
    );
    console.error(`Error creando ${paso} en el alta de socio:`, err);
  }

  private descripcionDePaso(paso: AltaPaso | null): { fallo: string; participio: string; reintento: string } {
    switch (paso) {
      case 'membresia':
        return { fallo: 'no se pudo crear la membresía', participio: 'la membresía', reintento: 'la membresía' };
      case 'pago':
        return { fallo: 'no se pudo registrar el pago', participio: 'el pago', reintento: 'el pago' };
      default:
        return { fallo: 'no se pudo crear el socio', participio: 'el alta del socio', reintento: 'todo el alta' };
    }
  }

  // ------------------------------------------------------------
  // Estado y validación de la sección de membresía
  // ------------------------------------------------------------

  onToggleAsignarMembresia(checked: boolean) {
    this.asignarMembresia.set(checked);
    this.altaError.set(null);
  }

  onToggleRegistrarPago(checked: boolean) {
    this.registrarPago.set(checked);
    this.altaError.set(null);
  }

  onMontoPagoInput() {
    this.montoPagoTocado.set(true);
  }

  /** Precarga el monto con el precio del plan, salvo que ya lo haya editado a mano. */
  private aplicarPrecioPlan() {
    if (this.montoPagoTocado()) return;
    const precio = this.getPlan(this.membresiaForm.getRawValue().planId)?.precio;
    if (precio != null) {
      this.pagoForm.patchValue({ monto: Number(precio) });
    }
  }

  private bloquearSeccionMembresia(bloquear: boolean) {
    this.setHabilitada(this.membresiaForm, !bloquear);
    if (bloquear) {
      this.pagoForm.disable({ emitEvent: false });
    } else {
      this.pagoForm.enable({ emitEvent: false });
    }
  }

  /** Valida solo los pasos que van a ejecutarse. Devuelve el mensaje o null. */
  private validarPasosPendientes(): string | null {
    if (!this.asignarMembresia() && !this.socioAltaCreado()) return null;

    if (!this.membresiaAltaCreada()) {
      if (this.sinPlanesActivos()) {
        return 'No hay planes activos. Desactivá "Asignar membresía ahora" para dar de alta solo el socio.';
      }
      if (this.membresiaForm.invalid) {
        this.membresiaForm.markAllAsTouched();
        return 'Seleccioná un plan para la membresía';
      }
    }

    if (this.registrarPago() && !this.pagoAltaCreado() && this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return this.pagoForm.get('medioPagoId')?.hasError('required')
        ? 'Seleccioná un medio de pago'
        : 'Ingresá el monto a cobrar, mayor a $0';
    }

    return null;
  }

  // ------------------------------------------------------------
  // DTOs
  // ------------------------------------------------------------
  private buildSocioDto(): CreateSocioDto {
    const formData = this.socioForm.getRawValue();
    return {
      dni: formData.dni,
      nombre: formData.nombre,
      apellido: formData.apellido,
      telefono: formData.telefono,
      fechaAlta: formData.fechaAlta
    };
  }

  private buildMembresiaDto(socioId: string, form: FormGroup): CreateMembresiaDto {
    const formData = form.getRawValue();
    return {
      socioId: String(socioId),
      planId: String(formData.planId),
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      estado: 'activa'
    };
  }

  private buildPagoDto(membresiaId: string): CreatePagoDto {
    const formData = this.pagoForm.getRawValue();
    return {
      membresiaId: String(membresiaId),
      medioPagoId: String(formData.medioPagoId),
      monto: Number(formData.monto),
      fechaPago: this.getToday()
    };
  }

  onDeleteSocio(socio: SocioResponseDto) {
    if (confirm(`¿Eliminar a ${socio.nombre} ${socio.apellido}?`)) {
      this.sociosService.sociosControllerDesactivar(socio.id).subscribe({
        next: (desactivado) => {
          this.socios.update(list => list.map(s => s.id === desactivado.id ? { ...s, activo: false } : s));
          this.toast.success('Socio desactivado correctamente', { title: 'Desactivado' });
        },
        error: (err) => {
          this.toast.error('No se pudo desactivar el socio', { title: 'Error' });
          console.error('Error deactivating socio:', err);
        }
      });
    }
  }

  fieldError(field: string): string | null {
    const control = this.socioForm.get(field);
    if (!control || !control.invalid || !(control.dirty || control.touched)) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('pattern')) return 'Ingrese solo números';
    return 'Valor inválido';
  }

  getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected readonly Math = Math;
}