import { ChangeDetectionStrategy, Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAngularModule, BadgeCheck, Edit, Eye, EyeOff, Info, KeyRound, Loader2, Mail, Plus, ShieldCheck,
  Store, User as UserIcon, Users, X
} from 'lucide-angular';
import {
  CreateUsuarioDto, NegocioAdminResponseDto, NegociosService, UpdateUsuarioDto, UsuarioResponseDto, UsuariosService
} from '@api';
import { ToastService } from '@core/services/toast.service';
import { RolUsuario, RoleService } from '@core/services/role.service';
import { modalOverlay, modalPanel } from '@shared/utils/animations';

@Component({
  selector: 'app-seccion-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  animations: [modalOverlay, modalPanel],
  templateUrl: './seccion-usuarios.component.html',
  styleUrls: ['./secciones.css']
})
export class SeccionUsuariosComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);
  private readonly negociosService = inject(NegociosService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);
  protected readonly roleService = inject(RoleService);

  readonly BadgeCheck = BadgeCheck;
  readonly Edit = Edit;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Info = Info;
  readonly KeyRound = KeyRound;
  readonly Loader2 = Loader2;
  readonly Mail = Mail;
  readonly Plus = Plus;
  readonly ShieldCheck = ShieldCheck;
  readonly Store = Store;
  readonly UserIcon = UserIcon;
  readonly Users = Users;
  readonly X = X;

  readonly loadingNegocios = signal(true);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly usuarios = signal<UsuarioResponseDto[]>([]);

  readonly negocios = signal<NegocioAdminResponseDto[]>([]);
  readonly negocioId = signal<string | null>(null);

  readonly showModal = signal(false);
  readonly editingUsuario = signal<UsuarioResponseDto | null>(null);
  readonly passwordVisible = signal(false);

  readonly rolOptions: { value: RolUsuario; label: string }[] = [
    { value: 'recepcionista', label: 'Recepcionista' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'dueno', label: 'Dueño' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    rol: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadNegocios();
  }

  onNegocioChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.negocioId.set(value || null);
    this.load();
  }

  sinClienteSeleccionado(): boolean {
    return this.negocioId() === null;
  }

  nombreCliente(): string {
    return this.negocios().find(n => n.id === this.negocioId())?.nombre ?? '';
  }

  private loadNegocios(): void {
    this.loadingNegocios.set(true);
    this.negociosService.negociosAdminControllerFindAll().subscribe({
      next: data => {
        const activos = data.filter(n => n.activo);
        this.negocios.set(activos);
        this.loadingNegocios.set(false);
        // Limpiar selección si el negocio elegido ya no está activo
        const currentId = this.negocioId();
        if (currentId && !activos.some(n => n.id === currentId)) {
          this.negocioId.set(null);
        }
        if (data.length === 0) {
          this.toast.warning('No hay clientes cargados. Creá un cliente antes de gestionar sus usuarios.', { title: 'Usuarios' });
        }
      },
      error: err => {
        console.error('Error loading negocios:', err);
        this.loadingNegocios.set(false);
        this.toast.error(this.backendMessage(err, 'No se pudieron cargar los clientes'), { title: 'Clientes' });
      }
    });
  }

  load(): void {
    const id = this.negocioId();
    if (!id) {
      this.usuarios.set([]);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.loadError.set(null);

    this.usuariosService.usuariosControllerFindAll(id).subscribe({
      next: data => {
        this.usuarios.set(this.sortByEmail(data));
        this.loading.set(false);
      },
      error: err => {
        console.error('Error loading usuarios:', err);
        this.loading.set(false);
        this.loadError.set(this.backendMessage(err, 'No se pudieron cargar los usuarios'));
      }
    });
  }

  canAssignRol(rol: RolUsuario): boolean {
    const current = this.roleService.currentUserRole();
    if (rol === 'super_admin') return current === 'super_admin';
    if (rol === 'dueno') return current === 'super_admin' || current === 'dueno';
    return true;
  }

  rolOptionsAvailable(): { value: RolUsuario; label: string }[] {
    return this.rolOptions.filter(o => this.canAssignRol(o.value));
  }

  canEditUsuario(u: UsuarioResponseDto): boolean {
    return u.rol !== 'super_admin';
  }

  canDeactivateUsuario(u: UsuarioResponseDto): boolean {
    return u.rol !== 'super_admin' && u.id !== this.roleService.currentUserId();
  }

  getUsuarioInitials(u: UsuarioResponseDto): string {
    return u.email.charAt(0).toUpperCase();
  }

  getRolLabel(rol: string): string {
    return this.rolOptions.find(o => o.value === rol)?.label ?? rol;
  }

  getRolBadgeClasses(rol: string): string {
    switch (rol) {
      case 'super_admin': return 'bg-tertiary-container text-on-tertiary-container';
      case 'dueno': return 'bg-secondary-container text-on-secondary-container';
      case 'administrador': return 'bg-primary-container text-on-primary-container';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  }

  rolIcon(rol: string): any {
    switch (rol) {
      case 'super_admin': return this.ShieldCheck;
      case 'dueno': return this.BadgeCheck;
      case 'administrador': return this.Users;
      default: return this.UserIcon;
    }
  }

  isCurrentUser(u: UsuarioResponseDto): boolean {
    return u.id === this.roleService.currentUserId();
  }

  openNew(): void {
    this.editingUsuario.set(null);
    this.form.reset({ email: '', password: '', rol: 'recepcionista' });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.form.markAsUntouched();
    this.passwordVisible.set(false);
    this.showModal.set(true);
  }

  openEdit(u: UsuarioResponseDto): void {
    if (!this.canEditUsuario(u)) {
      this.toast.warning('No se puede modificar una cuenta Super Admin', { title: 'Acción no permitida' });
      return;
    }

    this.editingUsuario.set(u);
    this.form.patchValue({ email: u.email, password: '', rol: u.rol });
    this.form.get('password')?.setValidators([Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
    this.form.markAsUntouched();
    this.passwordVisible.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    if (this.saving()) return;
    this.showModal.set(false);
    this.editingUsuario.set(null);
    this.form.reset({ email: '', password: '', rol: '' });
    this.form.get('password')?.setValidators([Validators.minLength(6)]);
    this.form.get('password')?.updateValueAndValidity();
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
    const editing = this.editingUsuario();

    if (!editing && !raw.password) {
      this.form.get('password')?.markAsTouched();
      return;
    }

    const negocioId = this.negocioId();
    if (!negocioId && !editing) {
      this.toast.error('Debés seleccionar un cliente para crear un usuario', { title: 'Cliente requerido' });
      this.saving.set(false);
      return;
    }

    this.saving.set(true);

    if (editing) {
      const updateData: UpdateUsuarioDto = { email: raw.email, rol: raw.rol as RolUsuario, negocioId: negocioId ?? undefined };
      if (raw.password) updateData.password = raw.password;

      this.usuariosService.usuariosControllerUpdate(String(editing.id), updateData).subscribe({
        next: updated => this.finishSave(updated, 'Usuario actualizado'),
        error: err => this.failSave(err, 'No se pudo actualizar el usuario')
      });
      return;
    }

    const createData: CreateUsuarioDto = {
      email: raw.email,
      password: raw.password,
      rol: raw.rol as RolUsuario,
      negocioId: negocioId!
    };

    this.usuariosService.usuariosControllerCreate(createData).subscribe({
      next: created => this.finishSave(created, 'Usuario creado'),
      error: err => this.failSave(err, 'No se pudo crear el usuario')
    });
  }

  private finishSave(saved: UsuarioResponseDto, message: string): void {
    this.saving.set(false);
    this.usuarios.update(list => {
      const exists = list.some(u => u.id === saved.id);
      return this.sortByEmail(exists ? list.map(u => (u.id === saved.id ? saved : u)) : [saved, ...list]);
    });
    this.closeModal();
    this.toast.success(message, { title: 'Guardado' });
  }

  private failSave(err: unknown, fallback: string): void {
    this.saving.set(false);
    this.toast.error(this.backendMessage(err, fallback), { title: 'Error' });
    console.error('Error saving usuario:', err);
  }

  onToggleActivo(u: UsuarioResponseDto): void {
    if (u.rol === 'super_admin') {
      this.toast.warning('No se puede modificar una cuenta Super Admin', { title: 'Acción no permitida' });
      return;
    }
    if (u.id === this.roleService.currentUserId()) {
      this.toast.warning('No podés desactivar tu propia cuenta', { title: 'Acción no permitida' });
      return;
    }
    if (!u.activo) {
      this.toast.info('La reactivación aún no está soportada por la API', { title: 'Sin cambios' });
      return;
    }

    this.usuariosService.usuariosControllerDesactivar(String(u.id), this.negocioId() ?? undefined).subscribe({
      next: deactivated => {
        this.usuarios.update(list => list.map(us => (us.id === deactivated.id ? { ...us, ...deactivated } : us)));
        this.toast.success(`${deactivated.email} desactivado`, { title: 'Desactivado' });
      },
      error: err => {
        this.toast.error(this.backendMessage(err, 'No se pudo desactivar el usuario'), { title: 'Error' });
        console.error('Error deactivating usuario:', err);
      }
    });
  }

  private sortByEmail(list: UsuarioResponseDto[]): UsuarioResponseDto[] {
    return [...list].sort((a, b) => a.email.localeCompare(b.email));
  }

  private backendMessage(err: unknown, fallback: string): string {
    return (err as { error?: { message?: string } })?.error?.message || fallback;
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown(): void {
    this.closeModal();
  }
}