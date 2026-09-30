import { ChangeDetectionStrategy, Component, inject, signal, OnInit, computed, HostListener } from '@angular/core';
import { LucideAngularModule, Plus, Search, Filter, ChevronLeft, ChevronRight, Loader2, Calendar, User, MoreVertical, Edit, Trash2, Eye, RotateCcw, X, CheckCircle, AlertCircle, Clock, Shield, CircleDollarSign, AlertTriangle, Ban, History, CalendarClock } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { MembresiasService, MembresiaResponseDto, CreateMembresiaDto, UpdateMembresiaDto, MembresiasControllerCancelarRequest } from '@api';
import { SociosService, SocioResponseDto } from '@api';
import { PlanesMembresiaService, PlanMembresiaResponseDto } from '@api';
import { PagosService, PagoResponseDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { PagoFormModalComponent } from '@shared/components';
import { modalOverlay, modalPanel, staggerGrid } from '@shared/utils/animations';

type EstadoFilter = '' | 'activa' | 'vencida' | 'suspendida' | 'cancelada';

interface EstadoTab {
  value: EstadoFilter;
  label: string;
}

interface TimelineItem {
  fecha: string;
  titulo: string;
  detalle: string;
  icon: any;
  dotClass: string;
}

@Component({
  selector: 'app-membresias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule, PagoFormModalComponent],
  animations: [staggerGrid, modalOverlay, modalPanel],
  templateUrl: './membresias.component.html',
  styleUrl: './membresias.component.css'
})
export class MembresiasComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private membresiasService = inject(MembresiasService);
  private sociosService = inject(SociosService);
  private planesService = inject(PlanesMembresiaService);
  private pagosService = inject(PagosService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Loader2 = Loader2;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly MoreVertical = MoreVertical;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly RotateCcw = RotateCcw;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly AlertCircle = AlertCircle;
  readonly Clock = Clock;
  readonly Shield = Shield;
  readonly CircleDollarSign = CircleDollarSign;
  readonly AlertTriangle = AlertTriangle;
  readonly Ban = Ban;
  readonly History = History;
  readonly CalendarClock = CalendarClock;

  estadoTabs: EstadoTab[] = [
    { value: '', label: 'Todas' },
    { value: 'activa', label: 'Activas' },
    { value: 'vencida', label: 'Vencidas' },
    { value: 'suspendida', label: 'Suspendidas' },
    { value: 'cancelada', label: 'Canceladas' }
  ];

  membresias = signal<MembresiaResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  estadoFilter = signal<EstadoFilter>('');
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);

  // Create / Edit modal
  showModal = signal(false);
  editingMembresia = signal<MembresiaResponseDto | null>(null);
  saving = signal(false);
  searchingSocio = signal(false);
  selectedSocio = signal<SocioResponseDto | null>(null);
  socioSearchTerm = signal('');

  // Renovar modal
  showRenovarModal = signal(false);
  renovarMembresia = signal<MembresiaResponseDto | null>(null);
  renovarSaving = signal(false);

  // Cancelar modal
  showCancelModal = signal(false);
  cancelarMembresia = signal<MembresiaResponseDto | null>(null);
  cancelarMotivo = signal('');
  cancelarSaving = signal(false);

  // Detalle modal
  showDetailModal = signal(false);
  detailMembresia = signal<MembresiaResponseDto | null>(null);
  detailPagos = signal<PagoResponseDto[]>([]);
  detailLoading = signal(false);
  detailError = signal<string | null>(null);

  // Registrar pago desde el detalle
  showPagoForm = signal(false);

  planes = signal<PlanMembresiaResponseDto[]>([]);
  planesActivos = computed(() => this.planes().filter(p => p.activo));
  loadingCatalogs = signal(false);

  membresiaForm = this.fb.nonNullable.group({
    socioId: ['', [Validators.required]],
    planId: ['', [Validators.required]],
    fechaInicio: [new Date().toISOString().split('T')[0], [Validators.required]],
    fechaFin: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], [Validators.required]],
    estado: ['activa', [Validators.required]]
  });

  ngOnInit() {
    this.layout.setPageTitle('Membresías');
    this.loadCatalogs();
    this.loadMembresias();
  }

  loadCatalogs() {
    this.loadingCatalogs.set(true);

    this.planesService.planesMembresiaControllerFindAll().subscribe({
      next: (data) => this.planes.set(data || []),
      error: () => console.error('Error loading planes')
    });

    setTimeout(() => this.loadingCatalogs.set(false), 300);
  }

  loadMembresias() {
    this.loading.set(true);
    this.error.set(null);

    const estado = this.estadoFilter() || undefined;
    this.membresiasService.membresiasControllerFindAll(undefined, estado as any, this.pageSize, this.currentPage() - 1).subscribe({
      next: (response) => {
        this.membresias.set(response.data || []);
        this.totalItems.set(response.total);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las membresías');
        this.loading.set(false);
        this.toast.error('No se pudieron cargar las membresías', { title: 'Error' });
        console.error('Error loading membresias:', err);
      }
    });
  }

  filteredMembresias = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.membresias();
    return this.membresias().filter(m =>
      m.socioNombre?.toLowerCase().includes(term) ||
      m.socioDni?.includes(term) ||
      m.planNombre?.toLowerCase().includes(term) ||
      this.getPlanTipo(m.planId)?.toLowerCase().includes(term)
    );
  });

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

  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onEstadoFilterChange(value: string) {
    this.estadoFilter.set(value as EstadoFilter);
    this.currentPage.set(1);
    this.loadMembresias();
  }

  onPageChange(page: number) {
    if (page === -1 || page === -2) return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadMembresias();
    }
  }

  // ------------------------------------------------------------
  // Helpers de planes
  // ------------------------------------------------------------
  getPlan(planId: string | undefined): PlanMembresiaResponseDto | undefined {
    if (!planId) return undefined;
    return this.planes().find(p => p.id === planId);
  }

  getPlanTipo(planId: string | undefined): string {
    return this.getPlan(planId)?.tipoMembresiaNombre || '—';
  }

  // ------------------------------------------------------------
  // Create / Edit
  // ------------------------------------------------------------
  openNewMembresiaModal() {
    this.editingMembresia.set(null);
    this.selectedSocio.set(null);
    this.socioSearchTerm.set('');
    this.membresiaForm.reset({
      socioId: '',
      planId: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'activa'
    });
    this.showModal.set(true);
  }

  openEditMembresiaModal(membresia: MembresiaResponseDto) {
    this.editingMembresia.set(membresia);
    this.membresiaForm.patchValue({
      socioId: String(membresia.socioId),
      planId: String(membresia.planId),
      fechaInicio: membresia.fechaInicio?.split('T')[0] || new Date().toISOString().split('T')[0],
      fechaFin: membresia.fechaFin?.split('T')[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: membresia.estado || 'activa'
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingMembresia.set(null);
    this.selectedSocio.set(null);
    this.socioSearchTerm.set('');
    this.membresiaForm.reset();
  }

  searchSocio() {
    const term = this.socioSearchTerm().trim();
    if (!term) return;

    this.searchingSocio.set(true);
    this.sociosService.sociosControllerFindAll(undefined, undefined, undefined, term, undefined, undefined, 10, 1).subscribe({
      next: (response) => {
        const socios = response.data || [];
        if (socios.length > 0) {
          this.selectedSocio.set(socios[0]);
          this.membresiaForm.patchValue({ socioId: String(socios[0].id) });
        } else {
          this.selectedSocio.set(null);
          this.toast.info('No se encontró ningún socio con ese criterio', { title: 'Sin resultados' });
        }
        this.searchingSocio.set(false);
      },
      error: () => {
        this.searchingSocio.set(false);
        console.error('Error searching socio');
      }
    });
  }

  onSubmitMembresia() {
    if (this.membresiaForm.invalid) {
      this.membresiaForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData = this.membresiaForm.getRawValue();
    const editing = this.editingMembresia();

    if (editing) {
      const updateDto: UpdateMembresiaDto = {
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin
      };
      this.membresiasService.membresiasControllerUpdate(String(editing.id), updateDto).subscribe({
        next: () => {
          this.closeModal();
          this.saving.set(false);
          this.loadMembresias();
          this.toast.success('Membresía actualizada correctamente', { title: 'Actualizada' });
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.error?.message || 'Error al actualizar la membresía', { title: 'Error' });
          console.error('Error updating membresia:', err);
        }
      });
      return;
    }

    const membresiaData: CreateMembresiaDto = {
      socioId: String(formData.socioId),
      planId: String(formData.planId),
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      estado: formData.estado as CreateMembresiaDto.EstadoEnum
    };

    this.membresiasService.membresiasControllerCreate(membresiaData).subscribe({
      next: () => {
        this.loadMembresias();
        this.closeModal();
        this.saving.set(false);
        this.toast.success('Membresía creada correctamente', { title: 'Creada' });
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Error al crear la membresía', { title: 'Error' });
        console.error('Error creating membresia:', err);
      }
    });
  }

  // ------------------------------------------------------------
  // Renovar
  // ------------------------------------------------------------
  openRenovarModal(membresia: MembresiaResponseDto) {
    this.renovarMembresia.set(membresia);
    this.renovarSaving.set(false);
    this.showRenovarModal.set(true);
  }

  closeRenovarModal() {
    this.showRenovarModal.set(false);
    this.renovarMembresia.set(null);
  }

  confirmRenovar() {
    const actual = this.renovarMembresia();
    if (!actual) return;

    this.renovarSaving.set(true);

    this.membresiasService.membresiasControllerRenovar(String(actual.id)).subscribe({
      next: () => {
        this.renovarSaving.set(false);
        this.closeRenovarModal();
        this.loadMembresias();
        this.toast.success(`Membresía renovada con el plan actual`, { title: 'Renovada' });
      },
      error: (err) => {
        this.renovarSaving.set(false);
        this.toast.error(err.error?.message || 'Error al renovar la membresía', { title: 'Error' });
        console.error('Error renovating membresia:', err);
      }
    });
  }

  // ------------------------------------------------------------
  // Cancelar
  // ------------------------------------------------------------
  openCancelModal(membresia: MembresiaResponseDto) {
    this.cancelarMembresia.set(membresia);
    this.cancelarMotivo.set('');
    this.cancelarSaving.set(false);
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.cancelarMembresia.set(null);
    this.cancelarMotivo.set('');
  }

  confirmCancelar() {
    const actual = this.cancelarMembresia();
    if (!actual) return;

    this.cancelarSaving.set(true);
    const request: MembresiasControllerCancelarRequest = {
      motivo: this.cancelarMotivo().trim() || undefined
    };

    this.membresiasService.membresiasControllerCancelar(String(actual.id), request).subscribe({
      next: () => {
        this.cancelarSaving.set(false);
        this.closeCancelModal();
        this.loadMembresias();
        this.toast.success('Membresía cancelada correctamente', { title: 'Cancelada' });
      },
      error: (err) => {
        this.cancelarSaving.set(false);
        this.toast.error(err.error?.message || 'Error al cancelar la membresía', { title: 'Error' });
        console.error('Error canceling membresia:', err);
      }
    });
  }

  // ------------------------------------------------------------
  // Detalle
  // ------------------------------------------------------------
  viewMembresiaDetail(membresia: MembresiaResponseDto) {
    this.detailMembresia.set(membresia);
    this.detailPagos.set([]);
    this.detailError.set(null);
    this.detailLoading.set(true);
    this.showDetailModal.set(true);

    this.pagosService.pagosControllerFindByMembresia(String(membresia.id)).subscribe({
      next: (pagos) => {
        this.detailPagos.set(pagos || []);
        this.detailLoading.set(false);
      },
      error: (err) => {
        this.detailError.set('No se pudieron cargar los pagos asociados');
        this.detailLoading.set(false);
        this.toast.error('No se pudieron cargar los pagos asociados', { title: 'Error' });
        console.error('Error loading pagos:', err);
      }
    });
  }

  closeDetailModal() {
    this.showDetailModal.set(false);
    this.detailMembresia.set(null);
    this.detailPagos.set([]);
    this.detailError.set(null);
  }

  openRegistrarPago() {
    this.showPagoForm.set(true);
  }

  onPagoRegistrado() {
    const actual = this.detailMembresia();
    if (!actual) return;
    this.pagosService.pagosControllerFindByMembresia(String(actual.id)).subscribe({
      next: (pagos) => this.detailPagos.set(pagos || []),
      error: () => console.error('Error reloading pagos del detalle')
    });
  }

  getEstadoTimeline(m: MembresiaResponseDto): TimelineItem[] {
    const items: TimelineItem[] = [];

    if (m.estado === 'cancelada' && m.fechaActualizacion) {
      items.push({
        fecha: m.fechaActualizacion,
        titulo: 'Membresía cancelada',
        detalle: 'Se dejó de prestar el servicio de acceso',
        icon: Ban,
        dotClass: 'bg-error-container text-error'
      });
    } else if (m.estado === 'vencida' && m.fechaActualizacion && m.fechaActualizacion !== m.fechaCreacion) {
      items.push({
        fecha: m.fechaActualizacion,
        titulo: 'Membresía vencida',
        detalle: 'Puede renovarse para continuar con el acceso',
        icon: Clock,
        dotClass: 'bg-warning-container text-warning'
      });
    }

    items.push({
      fecha: m.fechaCreacion,
      titulo: 'Creada',
      detalle: `${m.planNombre} · ${m.diasPorSemana} días/semana`,
      icon: CheckCircle,
      dotClass: 'bg-success-container text-success'
    });

    items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    return items;
  }

  // ------------------------------------------------------------
  // UI helpers
  // ------------------------------------------------------------
  onBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return;
    if (this.showDetailModal()) {
      this.closeDetailModal();
    } else if (this.showRenovarModal()) {
      this.closeRenovarModal();
    } else if (this.showCancelModal()) {
      this.closeCancelModal();
    } else if (this.showModal()) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown() {
    if (this.showPagoForm()) {
      return;
    }
    if (this.showDetailModal()) {
      this.closeDetailModal();
    } else if (this.showRenovarModal()) {
      this.closeRenovarModal();
    } else if (this.showCancelModal()) {
      this.closeCancelModal();
    } else if (this.showModal()) {
      this.closeModal();
    }
  }

  canRenovar(m: MembresiaResponseDto): boolean {
    return m.estado === 'activa' || m.estado === 'vencida';
  }

  isPorVencer(m: MembresiaResponseDto): boolean {
    return m.estado === 'activa' && this.getDiasRestantes(m.fechaFin) <= 7;
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

  getEstadoBadge(estado: string): { class: string, icon: any, label: string } {
    const lower = estado?.toLowerCase() || '';
    switch (lower) {
      case 'activa':
        return { class: 'bg-success-container text-on-success-container border border-success', icon: CheckCircle, label: 'Activa' };
      case 'vencida':
        return { class: 'bg-error-container text-on-error-container border border-error', icon: X, label: 'Vencida' };
      case 'suspendida':
        return { class: 'bg-warning-container text-on-warning-container border border-warning-dim', icon: AlertCircle, label: 'Suspendida' };
      case 'cancelada':
        return { class: 'bg-surface-variant text-on-surface-variant border border-outline-variant', icon: Trash2, label: 'Cancelada' };
      default:
        return { class: 'bg-surface-container-high text-on-surface-variant border border-outline-variant', icon: AlertCircle, label: estado };
    }
  }

  getDiasRestantes(fechaFin: string | Date | undefined): number {
    if (!fechaFin) return 0;
    const fin = new Date(fechaFin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fin.setHours(0, 0, 0, 0);
    const diffMs = fin.getTime() - hoy.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  protected readonly Math = Math;
}