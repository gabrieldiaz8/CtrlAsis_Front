import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule, BadgeCheck, Boxes, Calendar, Edit, Info, Loader2, Plus, Store, Trash2, X
} from 'lucide-angular';
import {
  CatalogosService, CreateTipoMembresiaDto, CreatePlanMembresiaDto, NegocioAdminResponseDto,
  NegociosService, PlanMembresiaResponseDto, PlanesMembresiaService, TipoMembresiaResponseDto,
  UpdatePlanMembresiaDto, UpdateTipoMembresiaDto
} from '@api';
import { ToastService } from '@core/services/toast.service';
import { modalOverlay, modalPanel } from '@shared/utils/animations';

@Component({
  selector: 'app-seccion-membresias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  animations: [modalOverlay, modalPanel],
  templateUrl: './seccion-membresias.component.html',
  styleUrls: ['./secciones.css']
})
export class SeccionMembresiasComponent implements OnInit {
  private readonly catalogosService = inject(CatalogosService);
  private readonly planesService = inject(PlanesMembresiaService);
  private readonly negociosService = inject(NegociosService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  readonly BadgeCheck = BadgeCheck;
  readonly Boxes = Boxes;
  readonly Calendar = Calendar;
  readonly Edit = Edit;
  readonly Info = Info;
  readonly Loader2 = Loader2;
  readonly Plus = Plus;
  readonly Store = Store;
  readonly Trash2 = Trash2;
  readonly X = X;

  readonly loadingNegocios = signal(true);
  readonly loading = signal(false);
  readonly savingTipo = signal(false);
  readonly savingPlan = signal(false);

  readonly negocios = signal<NegocioAdminResponseDto[]>([]);
  readonly negocioId = signal<string>('');

  readonly tipos = signal<TipoMembresiaResponseDto[]>([]);
  readonly planes = signal<PlanMembresiaResponseDto[]>([]);

  readonly showTipoModal = signal(false);
  readonly editingTipo = signal<TipoMembresiaResponseDto | null>(null);

  readonly showPlanModal = signal(false);
  readonly editingPlan = signal<PlanMembresiaResponseDto | null>(null);

  readonly tipoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['']
  });

  readonly planForm = this.fb.nonNullable.group({
    diasPorSemana: [5, [Validators.required, Validators.min(1), Validators.max(7)]],
    duracionDias: [30, [Validators.required, Validators.min(1)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    tipoMembresiaId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadNegocios();
  }

  /**
   * Los planes y los tipos son por cliente: el super_admin elige sobre qué
   * negocio está trabajando y todas las lecturas y escrituras se piden con ese
   * `negocioId`.
   */
  onNegocioChange(event: Event): void {
    this.negocioId.set((event.target as HTMLSelectElement).value);
    this.load();
  }

  sinClienteSeleccionado(): boolean {
    return !this.negocioId();
  }

  nombreCliente(): string {
    return this.negocios().find(n => n.id === this.negocioId())?.nombre ?? '';
  }

  faltaConfiguracionInicial(): boolean {
    return !!this.negocioId() && !this.loading() && (this.tipos().length === 0 || this.planes().length === 0);
  }

  cantidadPlanes(tipoId: string): number {
    return this.planes().filter(p => p.tipoMembresiaId === tipoId).length;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
  }

  private loadNegocios(): void {
    this.loadingNegocios.set(true);
    this.negociosService.negociosAdminControllerFindAll().subscribe({
      next: data => {
        this.negocios.set(data.filter(n => n.activo));
        this.loadingNegocios.set(false);
      },
      error: err => {
        console.error('Error loading negocios:', err);
        this.loadingNegocios.set(false);
        this.toast.error(this.backendMessage(err, 'No se pudieron cargar los clientes'), { title: 'Clientes' });
      }
    });
  }

  load(): void {
    const negocioId = this.negocioId();
    this.tipos.set([]);
    this.planes.set([]);
    if (!negocioId) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);

    this.catalogosService.catalogosControllerFindAllTiposMembresiaAdmin(negocioId).subscribe({
      next: data => this.tipos.set(this.sortByNombre(data)),
      error: err => {
        console.error('Error loading tipos membresia:', err);
        this.toast.error(this.backendMessage(err, 'No se pudieron cargar los tipos de membresía'), { title: 'Tipos' });
        this.loading.set(false);
      }
    });

    this.planesService.planesMembresiaControllerFindAllAdmin(negocioId).subscribe({
      next: data => {
        this.planes.set(data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading planes:', err);
        this.toast.error(this.backendMessage(err, 'No se pudieron cargar los planes'), { title: 'Planes' });
        this.loading.set(false);
      }
    });
  }

  // ============================================================
  // TIPOS DE MEMBRESÍA
  // ============================================================

  openNewTipo(): void {
    if (!this.negocioId()) return;
    this.editingTipo.set(null);
    this.tipoForm.reset({ nombre: '', descripcion: '' });
    this.showTipoModal.set(true);
  }

  openEditTipo(tipo: TipoMembresiaResponseDto): void {
    if (!this.negocioId()) return;
    this.editingTipo.set(tipo);
    this.tipoForm.reset({ nombre: tipo.nombre, descripcion: tipo.descripcion ?? '' });
    this.showTipoModal.set(true);
  }

  closeTipoModal(): void {
    if (this.savingTipo()) return;
    this.showTipoModal.set(false);
    this.editingTipo.set(null);
  }

  onSaveTipo(): void {
    if (this.tipoForm.invalid) {
      this.tipoForm.markAllAsTouched();
      return;
    }

    const negocioId = this.negocioId();
    if (!negocioId) return;

    const { nombre, descripcion } = this.tipoForm.getRawValue();
    const editing = this.editingTipo();
    this.savingTipo.set(true);

    if (editing) {
      const updateData: UpdateTipoMembresiaDto = { nombre, descripcion, negocioId };
      this.catalogosService.catalogosControllerUpdateTipoMembresia(String(editing.id), updateData).subscribe({
        next: updated => {
          this.tipos.update(list => this.sortByNombre(list.map(t => (t.id === updated.id ? { ...t, ...updated } : t))));
          this.finishTipoSave(`Tipo "${nombre}" actualizado`);
        },
        error: err => this.failTipoSave(err, 'No se pudo actualizar el tipo de membresía')
      });
      return;
    }

    const createData: CreateTipoMembresiaDto = { nombre, descripcion, negocioId };
    this.catalogosService.catalogosControllerCreateTipoMembresia(createData).subscribe({
      next: created => {
        this.tipos.update(list => this.sortByNombre([created, ...list]));
        this.finishTipoSave(`Tipo "${nombre}" creado`);
      },
      error: err => this.failTipoSave(err, 'No se pudo crear el tipo de membresía')
    });
  }

  private finishTipoSave(message: string): void {
    this.savingTipo.set(false);
    this.showTipoModal.set(false);
    this.editingTipo.set(null);
    this.toast.success(message, { title: 'Guardado' });
  }

  private failTipoSave(err: unknown, fallback: string): void {
    this.savingTipo.set(false);
    this.toast.error(this.backendMessage(err, fallback), { title: 'Error' });
    console.error(err);
  }

  onDesactivarTipo(tipo: TipoMembresiaResponseDto): void {
    const planes = this.cantidadPlanes(tipo.id);
    if (planes > 0) {
      this.toast.warning(`No se puede desactivar "${tipo.nombre}": tiene ${planes} plan(es) asociado(s)`, { title: 'Acción no permitida' });
      return;
    }

    this.catalogosService.catalogosControllerDesactivarTipoMembresia(String(tipo.id), this.negocioId() || undefined).subscribe({
      next: deactivated => {
        this.tipos.update(list => list.map(t => (t.id === deactivated.id ? { ...t, ...deactivated } : t)));
        this.toast.success(`"${tipo.nombre}" desactivado`, { title: 'Desactivado' });
      },
      error: err => {
        this.toast.error(this.backendMessage(err, 'No se pudo desactivar el tipo'), { title: 'Error' });
        console.error(err);
      }
    });
  }

  // ============================================================
  // PLANES
  // ============================================================

  openNewPlan(): void {
    if (!this.negocioId()) return;
    this.editingPlan.set(null);
    this.planForm.reset({ diasPorSemana: 5, duracionDias: 30, precio: 0, tipoMembresiaId: '' });
    this.showPlanModal.set(true);
  }

  openEditPlan(plan: PlanMembresiaResponseDto): void {
    if (!this.negocioId()) return;
    this.editingPlan.set(plan);
    this.planForm.reset({
      diasPorSemana: plan.diasPorSemana,
      duracionDias: plan.duracionDias,
      precio: plan.precio,
      tipoMembresiaId: plan.tipoMembresiaId
    });
    this.showPlanModal.set(true);
  }

  closePlanModal(): void {
    if (this.savingPlan()) return;
    this.showPlanModal.set(false);
    this.editingPlan.set(null);
  }

  onSavePlan(): void {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    const negocioId = this.negocioId();
    if (!negocioId) return;

    const raw = this.planForm.getRawValue();
    const editing = this.editingPlan();
    this.savingPlan.set(true);

    if (editing) {
      const updateData: UpdatePlanMembresiaDto = {
        diasPorSemana: raw.diasPorSemana,
        duracionDias: raw.duracionDias,
        precio: raw.precio,
        tipoMembresiaId: String(raw.tipoMembresiaId),
        negocioId
      };

      this.planesService.planesMembresiaControllerUpdate(String(editing.id), updateData).subscribe({
        next: updated => {
          this.planes.update(list => list.map(p => (p.id === updated.id ? updated : p)));
          this.finishPlanSave('Plan actualizado');
        },
        error: err => this.failPlanSave(err, 'No se pudo actualizar el plan')
      });
      return;
    }

    const createData: CreatePlanMembresiaDto = {
      diasPorSemana: raw.diasPorSemana,
      duracionDias: raw.duracionDias,
      precio: raw.precio,
      tipoMembresiaId: String(raw.tipoMembresiaId),
      negocioId
    };

    this.planesService.planesMembresiaControllerCreate(createData).subscribe({
      next: created => {
        this.planes.update(list => [created, ...list]);
        this.finishPlanSave('Plan creado');
      },
      error: err => this.failPlanSave(err, 'No se pudo crear el plan')
    });
  }

  private finishPlanSave(message: string): void {
    this.savingPlan.set(false);
    this.showPlanModal.set(false);
    this.editingPlan.set(null);
    this.toast.success(message, { title: 'Guardado' });
  }

  private failPlanSave(err: unknown, fallback: string): void {
    this.savingPlan.set(false);
    this.toast.error(this.backendMessage(err, fallback), { title: 'Error' });
    console.error(err);
  }

  onDesactivarPlan(plan: PlanMembresiaResponseDto): void {
    this.planesService.planesMembresiaControllerDesactivar(String(plan.id), this.negocioId() || undefined).subscribe({
      next: deactivated => {
        this.planes.update(list => list.map(p => (p.id === deactivated.id ? deactivated : p)));
        this.toast.success('Plan desactivado', { title: 'Desactivado' });
      },
      error: err => {
        this.toast.error(this.backendMessage(err, 'No se pudo desactivar el plan'), { title: 'Error' });
        console.error(err);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown(): void {
    this.closeTipoModal();
    this.closePlanModal();
  }

  private sortByNombre(list: TipoMembresiaResponseDto[]): TipoMembresiaResponseDto[] {
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  private backendMessage(err: unknown, fallback: string): string {
    return (err as { error?: { message?: string } })?.error?.message || fallback;
  }
}