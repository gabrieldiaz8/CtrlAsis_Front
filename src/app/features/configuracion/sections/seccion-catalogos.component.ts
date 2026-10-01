import { ChangeDetectionStrategy, Component, HostListener, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule, CreditCard, Edit, Info, Loader2, Plus, ShieldCheck, Tag, Trash2, X
} from 'lucide-angular';
import {
  CatalogosService, CreateMedioPagoDto, CreateRubroDto, MedioPagoResponseDto, RubroResponseDto,
  UpdateMedioPagoDto, UpdateRubroDto
} from '@api';
import { ToastService } from '@core/services/toast.service';
import { RoleService } from '@core/services/role.service';
import { modalOverlay, modalPanel } from '@shared/utils/animations';

type CatalogoTab = 'rubros' | 'medios-pago';

@Component({
  selector: 'app-seccion-catalogos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  animations: [modalOverlay, modalPanel],
  templateUrl: './seccion-catalogos.component.html',
  styleUrls: ['./secciones.css']
})
export class SeccionCatalogosComponent implements OnInit {
  private readonly catalogosService = inject(CatalogosService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly roleService = inject(RoleService);

  readonly CreditCard = CreditCard;
  readonly Tag = Tag;
  readonly Edit = Edit;
  readonly Info = Info;
  readonly Loader2 = Loader2;
  readonly Plus = Plus;
  readonly ShieldCheck = ShieldCheck;
  readonly Trash2 = Trash2;
  readonly X = X;

  readonly activeTab = signal<CatalogoTab>('rubros');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly forbidden = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly rubros = signal<RubroResponseDto[]>([]);
  readonly mediosPago = signal<MedioPagoResponseDto[]>([]);

  readonly showModal = signal(false);
  readonly editingId = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]]
  });

  readonly isSuperAdmin = computed(() => this.roleService.hasRole('super_admin'));

  readonly items = computed(() => (this.activeTab() === 'rubros' ? this.rubros() : this.mediosPago()));

  readonly singularLabel = computed(() => (this.activeTab() === 'rubros' ? 'Rubro' : 'Medio de pago'));
  readonly pluralLabel = computed(() => (this.activeTab() === 'rubros' ? 'Rubros' : 'Medios de pago'));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.forbidden.set(false);
    this.loadError.set(null);

    if (!this.isSuperAdmin()) {
      this.loading.set(false);
      this.forbidden.set(true);
      return;
    }

    let pendientes = 2;
    const complete = (): void => {
      pendientes -= 1;
      if (pendientes === 0) this.loading.set(false);
    };

    this.catalogosService.catalogosControllerFindAllRubrosAdmin().subscribe({
      next: data => {
        this.rubros.set(this.sortByNombre(data));
        complete();
      },
      error: err => {
        complete();
        this.failLoad(err, 'rubros');
      }
    });

    this.catalogosService.catalogosControllerFindAllMediosPagoAdmin().subscribe({
      next: data => {
        this.mediosPago.set(this.sortByNombre(data));
        complete();
      },
      error: err => {
        complete();
        this.failLoad(err, 'medios de pago');
      }
    });
  }

  onTabChange(tab: CatalogoTab): void {
    this.activeTab.set(tab);
  }

  openNew(): void {
    this.editingId.set(null);
    this.form.reset({ nombre: '' });
    this.showModal.set(true);
  }

  openEdit(id: string, nombre: string): void {
    this.editingId.set(id);
    this.form.reset({ nombre });
    this.showModal.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.showModal.set(false);
    this.editingId.set(null);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre } = this.form.getRawValue();
    const editingId = this.editingId();
    this.saving.set(true);

    if (this.activeTab() === 'rubros') {
      editingId
        ? this.updateRubro(editingId, nombre)
        : this.createRubro(nombre);
    } else {
      editingId
        ? this.updateMedioPago(editingId, nombre)
        : this.createMedioPago(nombre);
    }
  }

  private createRubro(nombre: string): void {
    const createData: CreateRubroDto = { nombre };
    this.catalogosService.catalogosControllerCreateRubro(createData).subscribe({
      next: created => {
        this.rubros.update(list => this.sortByNombre([created, ...list]));
        this.finishSave(`Rubro "${nombre}" creado`);
      },
      error: err => this.failSave(err, 'No se pudo crear el rubro')
    });
  }

  private updateRubro(id: string, nombre: string): void {
    const updateData: UpdateRubroDto = { nombre };
    this.catalogosService.catalogosControllerUpdateRubro(id, updateData).subscribe({
      next: updated => {
        this.rubros.update(list => this.sortByNombre(list.map(r => (r.id === updated.id ? { ...r, ...updated } : r))));
        this.finishSave(`Rubro "${nombre}" actualizado`);
      },
      error: err => this.failSave(err, 'No se pudo actualizar el rubro')
    });
  }

  private createMedioPago(nombre: string): void {
    const createData: CreateMedioPagoDto = { nombre };
    this.catalogosService.catalogosControllerCreateMedioPago(createData).subscribe({
      next: created => {
        this.mediosPago.update(list => this.sortByNombre([created, ...list]));
        this.finishSave(`Medio "${nombre}" creado`);
      },
      error: err => this.failSave(err, 'No se pudo crear el medio de pago')
    });
  }

  private updateMedioPago(id: string, nombre: string): void {
    const updateData: UpdateMedioPagoDto = { nombre };
    this.catalogosService.catalogosControllerUpdateMedioPago(id, updateData).subscribe({
      next: updated => {
        this.mediosPago.update(list => this.sortByNombre(list.map(m => (m.id === updated.id ? { ...m, ...updated } : m))));
        this.finishSave(`Medio "${nombre}" actualizado`);
      },
      error: err => this.failSave(err, 'No se pudo actualizar el medio de pago')
    });
  }

  onDesactivar(id: string, nombre: string): void {
    const request = this.activeTab() === 'rubros'
      ? this.catalogosService.catalogosControllerDesactivarRubro(id)
      : this.catalogosService.catalogosControllerDesactivarMedioPago(id);

    request.subscribe({
      next: deactivated => {
        if (this.activeTab() === 'rubros') {
          this.rubros.update(list => list.map(r => (r.id === deactivated.id ? { ...r, ...deactivated } : r)));
        } else {
          this.mediosPago.update(list => list.map(m => (m.id === deactivated.id ? { ...m, ...deactivated } : m)));
        }
        this.toast.success(`"${nombre}" desactivado`, { title: 'Desactivado' });
      },
      error: err => this.failSave(err, 'No se pudo desactivar')
    });
  }

  private finishSave(message: string): void {
    this.saving.set(false);
    this.showModal.set(false);
    this.editingId.set(null);
    this.toast.success(message, { title: 'Guardado' });
  }

  private failSave(err: unknown, fallback: string): void {
    this.saving.set(false);
    if (this.isForbidden(err)) {
      this.forbidden.set(true);
      this.toast.error(this.backendMessage(err, 'Solo el Super Admin puede modificar medios de pago y rubros'), { title: 'Sin permisos' });
      return;
    }
    this.toast.error(this.backendMessage(err, fallback), { title: 'Error' });
    console.error(err);
  }

  private failLoad(err: unknown, what: string): void {
    console.error(`Error loading ${what}:`, err);
    this.loading.set(false);
    if (this.isForbidden(err)) {
      this.forbidden.set(true);
      this.toast.error(this.backendMessage(err, 'Solo el Super Admin puede administrar medios de pago y rubros'), { title: 'Sin permisos' });
      return;
    }
    const message = this.backendMessage(err, `No se pudieron cargar los ${what}`);
    this.loadError.set(message);
    this.toast.error(message, { title: 'Error' });
  }

  private isForbidden(err: unknown): boolean {
    return (err as { status?: number })?.status === 403;
  }

  private backendMessage(err: unknown, fallback: string): string {
    return (err as { error?: { message?: string } })?.error?.message || fallback;
  }

  private sortByNombre<T extends { nombre: string }>(list: T[]): T[] {
    return [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown(): void {
    this.closeModal();
  }
}