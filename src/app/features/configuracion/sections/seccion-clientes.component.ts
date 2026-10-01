import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule, Building, Edit, Eye, EyeOff, Info, KeyRound, Loader2, Mail, Plus, Store, Tag, X, Trash2, ToggleLeft, AlertTriangle
} from 'lucide-angular';
import {
  CatalogosService, CreateNegocioDto, NegocioAdminResponseDto, NegociosService, NegociosAdminControllerEliminarRequest, RubroResponseDto, UpdateNegocioDto
} from '@api';
import { ToastService } from '@core/services/toast.service';
import { RoleService } from '@core/services/role.service';
import { modalOverlay, modalPanel } from '@shared/utils/animations';

@Component({
  selector: 'app-seccion-clientes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  animations: [modalOverlay, modalPanel],
  templateUrl: './seccion-clientes.component.html',
  styleUrls: ['./secciones.css']
})
export class SeccionClientesComponent implements OnInit {
  private readonly negociosService = inject(NegociosService);
  private readonly catalogosService = inject(CatalogosService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  private readonly roleService = inject(RoleService);

  readonly Building = Building;
  readonly Edit = Edit;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Info = Info;
  readonly KeyRound = KeyRound;
  readonly Loader2 = Loader2;
  readonly Mail = Mail;
  readonly Plus = Plus;
  readonly Store = Store;
  readonly Tag = Tag;
  readonly X = X;
  readonly Trash2 = Trash2;
  readonly ToggleLeft = ToggleLeft;
  readonly AlertTriangle = AlertTriangle;

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly negocios = signal<NegocioAdminResponseDto[]>([]);
  readonly rubros = signal<RubroResponseDto[]>([]);

  readonly showModal = signal(false);
  readonly editingNegocio = signal<NegocioAdminResponseDto | null>(null);
  readonly passwordVisible = signal(false);
  readonly submitError = signal<string | null>(null);

  // Delete modal
  readonly showDeleteModal = signal(false);
  readonly deletingNegocio = signal<NegocioAdminResponseDto | null>(null);
  readonly deleteConfirmInput = signal('');
  readonly deleteLoading = signal(false);
  readonly deleteError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    rubroId: ['', [Validators.required]],
    duenoEmail: ['', [Validators.required, Validators.email]],
    duenoPassword: ['', [Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.catalogosService.catalogosControllerFindAllRubros().subscribe({
      next: data => this.rubros.set(data.filter(r => r.activo)),
      error: err => {
        console.error('Error loading rubros:', err);
        this.toast.error(this.backendMessage(err, 'No se pudieron cargar los rubros'), { title: 'Rubros' });
      }
    });

    this.negociosService.negociosAdminControllerFindAll().subscribe({
      next: data => {
        this.negocios.set(data);
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading negocios:', err);
        this.loading.set(false);
        this.loadError.set(this.backendMessage(err, 'No se pudieron cargar los negocios'));
      }
    });
  }

  openNew(): void {
    this.editingNegocio.set(null);
    this.form.reset({ nombre: '', rubroId: '', duenoEmail: '', duenoPassword: '' });
    this.form.get('duenoPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('duenoPassword')?.updateValueAndValidity();
    this.form.markAsUntouched();
    this.passwordVisible.set(false);
    this.submitError.set(null);
    this.showModal.set(true);
  }

  openEdit(negocio: NegocioAdminResponseDto): void {
    this.editingNegocio.set(negocio);
    this.form.reset({
      nombre: negocio.nombre,
      rubroId: negocio.rubroId ?? '',
      duenoEmail: negocio.duenoEmail,
      duenoPassword: ''
    });
    this.form.get('duenoEmail')?.clearValidators();
    this.form.get('duenoPassword')?.clearValidators();
    this.form.get('duenoPassword')?.updateValueAndValidity();
    this.form.markAsUntouched();
    this.passwordVisible.set(false);
    this.submitError.set(null);
    this.showModal.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.showModal.set(false);
    this.editingNegocio.set(null);
    this.submitError.set(null);
    this.form.get('duenoPassword')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('duenoPassword')?.updateValueAndValidity();
  }

  togglePassword(): void {
    this.passwordVisible.update(v => !v);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const createData: CreateNegocioDto = {
      nombre: raw.nombre.trim(),
      rubroId: String(raw.rubroId),
      duenoEmail: raw.duenoEmail.trim(),
      duenoPassword: raw.duenoPassword
    };

    this.saving.set(true);
    this.submitError.set(null);

    const editing = this.editingNegocio();
    if (editing) {
      const updateData: UpdateNegocioDto = { nombre: raw.nombre.trim(), rubroId: String(raw.rubroId) };
      this.negociosService.negociosAdminControllerUpdate(String(editing.id), updateData).subscribe({
        next: updated => {
          this.saving.set(false);
          this.negocios.update(list => list.map(n => (n.id === updated.id ? updated : n)));
          this.showModal.set(false);
          this.toast.success(`Cliente "${updated.nombre}" actualizado`, { title: 'Cliente actualizado' });
        },
        error: err => {
          this.saving.set(false);
          const message = this.duplicateMessage(err) || this.backendMessage(err, 'No se pudo actualizar el cliente');
          this.submitError.set(message);
          this.toast.error(message, { title: 'Error' });
          console.error('Error updating negocio:', err);
        }
      });
      return;
    }

    this.negociosService.negociosAdminControllerCreate(createData).subscribe({
      next: created => {
        this.saving.set(false);
        this.negocios.update(list => [...list, created]);
        this.showModal.set(false);
        this.toast.success(`Cliente "${created.nombre}" creado. Entregale la contraseña al dueño y pedile que la cambie`, { title: 'Cliente creado', duration: 7000 });
      },
      error: err => {
        this.saving.set(false);
        const message = this.duplicateMessage(err) || this.backendMessage(err, 'No se pudo crear el cliente');
        this.submitError.set(message);
        this.toast.error(message, { title: 'Error' });
        console.error('Error creating negocio:', err);
      }
    });
  }

  /** Desactivar / Reactivar según estado actual */
  toggleEstado(negocio: NegocioAdminResponseDto): void {
    const isActive = negocio.activo;
    const action = isActive ? 'desactivar' : 'reactivar';
    const actionLabel = isActive ? 'desactivado' : 'reactivado';

    this.negociosService[`negociosAdminController${isActive ? 'Desactivar' : 'Reactivar'}`](String(negocio.id)).subscribe({
      next: updated => {
        this.negocios.update(list => list.map(n => (n.id === updated.id ? updated : n)));
        this.toast.success(`Cliente "${updated.nombre}" ${actionLabel}`, { title: `Cliente ${actionLabel}` });
      },
      error: err => {
        const message = this.backendMessage(err, `No se pudo ${action} el cliente`);
        this.toast.error(message, { title: 'Error' });
        console.error(`Error ${action} negocio:`, err);
      }
    });
  }

  /** Abre modal de confirmación para eliminar */
  openDeleteModal(negocio: NegocioAdminResponseDto): void {
    this.deletingNegocio.set(negocio);
    this.deleteConfirmInput.set('');
    this.deleteError.set(null);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    if (this.deleteLoading()) return;
    this.showDeleteModal.set(false);
    this.deletingNegocio.set(null);
    this.deleteConfirmInput.set('');
    this.deleteError.set(null);
  }

  onDeleteConfirmInput(value: string): void {
    this.deleteConfirmInput.set(value);
    this.deleteError.set(null);
  }

  onDeleteConfirm(): void {
    const negocio = this.deletingNegocio();
    if (!negocio) return;

    const expectedName = negocio.nombre;
    const inputName = this.deleteConfirmInput().trim();

    if (inputName !== expectedName) {
      this.deleteError.set('El nombre no coincide exactamente. Copia y pega el nombre tal cual aparece.');
      return;
    }

    this.deleteLoading.set(true);
    this.deleteError.set(null);

    const request: NegociosAdminControllerEliminarRequest = { confirmarNombre: expectedName };

    this.negociosService.negociosAdminControllerEliminar(String(negocio.id), request).subscribe({
      next: () => {
        this.deleteLoading.set(false);
        this.negocios.update(list => list.filter(n => n.id !== negocio.id));
        this.showDeleteModal.set(false);
        this.toast.success(`Cliente "${negocio.nombre}" eliminado definitivamente`, { title: 'Cliente eliminado' });
      },
      error: err => {
        this.deleteLoading.set(false);
        const message = this.backendMessage(err, 'No se pudo eliminar el cliente');
        this.deleteError.set(message);
        this.toast.error(message, { title: 'Error' });
        console.error('Error deleting negocio:', err);
      }
    });
  }

  /** Verifica si es el negocio propio del super_admin logueado */
  isOwnNegocio(negocio: NegocioAdminResponseDto): boolean {
    return this.roleService.currentUserNegocioId() === negocio.id;
  }

  /** Determina si mostrar acción de desactivar/reactivar */
  canToggleEstado(negocio: NegocioAdminResponseDto): boolean {
    return !this.isOwnNegocio(negocio);
  }

  /** Determina si mostrar acción de eliminar (solo si desactivado y no es propio) */
  canDelete(negocio: NegocioAdminResponseDto): boolean {
    return !negocio.activo && !this.isOwnNegocio(negocio);
  }

  isDuplicateError(err: unknown): boolean {
    return (err as { status?: number })?.status === 409;
  }

  private duplicateMessage(err: unknown, fallback = 'Ya existe un negocio o un usuario con esos datos'): string | null {
    if (!this.isDuplicateError(err)) return null;
    return this.backendMessage(err, fallback);
  }

  private backendMessage(err: unknown, fallback: string): string {
    return (err as { error?: { message?: string } })?.error?.message || fallback;
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown(): void {
    this.closeModal();
    this.closeDeleteModal();
  }
}