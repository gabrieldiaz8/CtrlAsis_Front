import { ChangeDetectionStrategy, Component, HostListener, inject, signal, OnInit } from '@angular/core';
import { LucideAngularModule, Loader2, Building, Save, AlertCircle, Edit, Tag, Plus, Trash2, X, Users, CreditCard, BadgeCheck, Mail, Phone, MapPin, Clock, KeyRound, Eye, EyeOff, RefreshCw, Image as ImageIcon, User as UserIcon, ShieldCheck, Boxes } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { NegocioService, NegocioResponseDto, UpdateNegocioDto, CatalogosService, RubroResponseDto, TipoMembresiaResponseDto, MedioPagoResponseDto, UsuariosService, UsuarioResponseDto, CreateUsuarioDto, UpdateUsuarioDto, PlanesMembresiaService, PlanMembresiaResponseDto, CreateTipoMembresiaDto, UpdateTipoMembresiaDto, CreateMedioPagoDto, UpdateMedioPagoDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '@core/services/toast.service';
import { RoleService, RolUsuario } from '@core/services/role.service';
import { crossfade, modalOverlay, modalPanel, staggerGrid } from '@shared/utils/animations';

type ConfigTab = 'negocio' | 'tipos' | 'medios' | 'usuarios';

interface TabConfig {
  id: ConfigTab;
  label: string;
  icon: any;
  description: string;
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  animations: [crossfade, modalOverlay, modalPanel, staggerGrid],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private negocioService = inject(NegocioService);
  private catalogosService = inject(CatalogosService);
  private usuariosService = inject(UsuariosService);
  private planesService = inject(PlanesMembresiaService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  protected readonly roleService = inject(RoleService);

  readonly Loader2 = Loader2;
  readonly Building = Building;
  readonly Save = Save;
  readonly AlertCircle = AlertCircle;
  readonly Edit = Edit;
  readonly Tag = Tag;
  readonly Plus = Plus;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly Users = Users;
  readonly CreditCard = CreditCard;
  readonly BadgeCheck = BadgeCheck;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Clock = Clock;
  readonly KeyRound = KeyRound;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly RefreshCw = RefreshCw;
  readonly ImageIcon = ImageIcon;
  readonly UserIcon = UserIcon;
  readonly ShieldCheck = ShieldCheck;
  readonly Boxes = Boxes;

  readonly tabs: TabConfig[] = [
    { id: 'negocio', label: 'Datos del negocio', icon: Building, description: 'Info general y contacto' },
    { id: 'tipos', label: 'Tipos de membresía', icon: BadgeCheck, description: 'Catálogo de membresías' },
    { id: 'medios', label: 'Medios de pago', icon: CreditCard, description: 'Formas de cobro disponibles' },
    { id: 'usuarios', label: 'Usuarios del staff', icon: Users, description: 'Accesos y roles' }
  ];

  readonly rolOptions: { value: RolUsuario; label: string }[] = [
    { value: 'recepcionista', label: 'Recepcionista' },
    { value: 'administrador', label: 'Administrador' },
    { value: 'dueno', label: 'Dueño' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  activeTab = signal<ConfigTab>('negocio');
  loading = signal(true);
  error = signal<string | null>(null);

  negocio = signal<NegocioResponseDto | null>(null);
  rubros = signal<RubroResponseDto[]>([]);
  tiposMembresia = signal<TipoMembresiaResponseDto[]>([]);
  mediosPago = signal<MedioPagoResponseDto[]>([]);
  usuarios = signal<UsuarioResponseDto[]>([]);
  planes = signal<PlanMembresiaResponseDto[]>([]);

  tabsLoading = signal<Record<ConfigTab, boolean>>({
    negocio: true,
    tipos: true,
    medios: true,
    usuarios: true
  });

  savingNegocio = signal(false);
  savingCatalogo = signal(false);
  savingUsuario = signal(false);

  showCatalogoModal = signal(false);
  editingCatalogo = signal<TipoMembresiaResponseDto | MedioPagoResponseDto | null>(null);

  showUsuarioModal = signal(false);
  editingUsuario = signal<UsuarioResponseDto | null>(null);
  passwordVisible = signal(false);

  logoPreview = signal<string | null>(null);
  logoDataUrl = signal<string | null>(null);

  negocioForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    rubroId: ['', [Validators.required]]
  });

  catalogoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: ['']
  });

  usuarioForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.minLength(6)]],
    rol: ['', [Validators.required]]
  });

  private pendingLoads = 0;

  ngOnInit() {
    this.layout.setPageTitle('Configuración');
    this.loadAll();
  }

  loadAll() {
    this.pendingLoads = 6;
    this.loading.set(true);
    this.error.set(null);

    this.loadNegocio();
    this.loadRubros();
    this.loadTipos();
    this.loadMedios();
    this.loadUsuarios();
    this.loadPlanes();
  }

  private finishLoad(tab: ConfigTab, ok: boolean) {
    this.tabsLoading.update(state => ({ ...state, [tab]: false }));
    this.pendingLoads--;
    if (this.pendingLoads === 0) {
      this.loading.set(false);
      if (!ok) this.error.set('Hubo un problema al cargar algunos datos.');
    }
  }

  loadNegocio() {
    this.negocioService.negociosControllerFindByCurrentUser().subscribe({
      next: (data) => {
        this.negocio.set(data);
        this.negocioForm.patchValue({
          nombre: data.nombre,
          rubroId: String(data.rubroId)
        });
        this.finishLoad('negocio', true);
      },
      error: (err) => {
        this.finishLoad('negocio', false);
        console.error('Error loading negocio:', err);
      }
    });
  }

  loadRubros() {
    this.catalogosService.catalogosControllerFindAllRubros().subscribe({
      next: (data) => {
        this.rubros.set(data.filter(r => r.activo));
        if (this.negocioForm.get('rubroId')?.value === '') {
          const currentRubro = this.negocio()?.rubroId;
          if (currentRubro) this.negocioForm.get('rubroId')?.setValue(String(currentRubro));
        }
        this.finishLoad('negocio', true);
      },
      error: () => {
        this.finishLoad('negocio', false);
        console.error('Error loading rubros')
      }
    });
  }

  loadTipos() {
    this.catalogosService.catalogosControllerFindAllTiposMembresiaAdmin().subscribe({
      next: (data) => {
        this.tiposMembresia.set(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.finishLoad('tipos', true);
      },
      error: () => {
        this.finishLoad('tipos', false);
        console.error('Error loading tipos membresia')
      }
    });
  }

  loadMedios() {
    this.catalogosService.catalogosControllerFindAllMediosPagoAdmin().subscribe({
      next: (data) => {
        this.mediosPago.set(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        this.finishLoad('medios', true);
      },
      error: () => {
        this.finishLoad('medios', false);
        console.error('Error loading medios pago')
      }
    });
  }

  loadUsuarios() {
    this.usuariosService.usuariosControllerFindAll().subscribe({
      next: (data) => {
        this.usuarios.set(data.sort((a, b) => a.email.localeCompare(b.email)));
        this.finishLoad('usuarios', true);
      },
      error: () => {
        this.finishLoad('usuarios', false);
        console.error('Error loading usuarios')
      }
    });
  }

  loadPlanes() {
    this.planesService.planesMembresiaControllerFindAllAdmin().subscribe({
      next: (data) => {
        this.planes.set(data);
        this.finishLoad('tipos', true);
      },
      error: () => {
        this.finishLoad('tipos', false);
        console.error('Error loading planes')
      }
    });
  }

  onTabChange(tab: ConfigTab) {
    this.activeTab.set(tab);
  }

  getTabIcon(tab: ConfigTab): any {
    return this.tabs.find(t => t.id === tab)?.icon ?? this.Building;
  }

  getTabConfig(): TabConfig {
    return this.tabs.find(t => t.id === this.activeTab()) ?? this.tabs[0];
  }

  // ============================================================
  // TAB 1 - DATOS DEL NEGOCIO
  // ============================================================

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.toast.error('El archivo debe ser una imagen', { title: 'Logo' });
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toast.error('La imagen no debe superar 1 MB', { title: 'Logo' });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.logoDataUrl.set(String(reader.result));
      this.logoPreview.set(this.logoDataUrl());
    };
    reader.onerror = () => this.toast.error('No se pudo leer la imagen', { title: 'Logo' });
    reader.readAsDataURL(file);
    input.value = '';
  }

  removeLogo() {
    this.logoDataUrl.set(null);
    this.logoPreview.set(null);
  }

  onSaveNegocio() {
    if (this.negocioForm.invalid) {
      this.negocioForm.markAllAsTouched();
      return;
    }

    this.savingNegocio.set(true);
    const formData = this.negocioForm.getRawValue();

    const updateData: UpdateNegocioDto = {
      nombre: formData.nombre,
      rubroId: String(formData.rubroId)
    };

    this.negocioService.negociosControllerUpdate(updateData).subscribe({
      next: (updated) => {
        this.negocio.set(updated);
        this.savingNegocio.set(false);
        this.toast.success('Datos del negocio guardados correctamente', { title: 'Guardado' });
      },
      error: (err) => {
        this.savingNegocio.set(false);
        this.toast.error((err as any)?.error?.message || 'No se pudieron guardar los datos', { title: 'Error' });
        console.error('Error updating negocio:', err);
      }
    });
  }

  // ============================================================
  // TAB 2 Y 3 - CATÁLOGOS (TIPOS DE MEMBRESÍA / MEDIOS DE PAGO)
  // ============================================================

  cantidadPlanes(tipoId: string): number {
    return this.planes().filter(p => p.tipoMembresiaId === tipoId).length;
  }

  openNewCatalogo() {
    this.editingCatalogo.set(null);
    this.catalogoForm.reset({ nombre: '', descripcion: '' });
    this.showCatalogoModal.set(true);
  }

  openEditCatalogo(item: TipoMembresiaResponseDto | MedioPagoResponseDto) {
    this.editingCatalogo.set(item);
    this.catalogoForm.patchValue({
      nombre: item.nombre,
      descripcion: (item as any).descripcion || ''
    });
    this.showCatalogoModal.set(true);
  }

  closeCatalogoModal() {
    if (this.savingCatalogo()) return;
    this.showCatalogoModal.set(false);
    this.editingCatalogo.set(null);
    this.catalogoForm.reset({ nombre: '', descripcion: '' });
  }

  getCatalogoTitle(): string {
    const label = this.activeTab() === 'tipos' ? 'tipo de membresía' : 'medio de pago';
    return this.editingCatalogo() ? `Editar ${label}` : `Nuevo ${label}`;
  }

  onSaveCatalogo() {
    if (this.catalogoForm.invalid) {
      this.catalogoForm.markAllAsTouched();
      return;
    }

    this.savingCatalogo.set(true);
    const formData = this.catalogoForm.getRawValue();
    const editing = this.editingCatalogo();
    const tab = this.activeTab();

    if (tab === 'tipos') {
      this.saveTipoMembresia(formData.nombre, formData.descripcion, editing as TipoMembresiaResponseDto | null);
    } else {
      this.saveMedioPago(formData.nombre, editing as MedioPagoResponseDto | null);
    }
  }

  private saveTipoMembresia(nombre: string, descripcion: string, editing: TipoMembresiaResponseDto | null) {
    if (editing) {
      const updateData: UpdateTipoMembresiaDto = { nombre, descripcion };
      this.catalogosService.catalogosControllerUpdateTipoMembresia(String(editing.id), updateData).subscribe({
        next: (updated) => {
          this.tiposMembresia.update(list => list.map(i => i.id === updated.id ? { ...i, ...updated } : i).sort((a, b) => a.nombre.localeCompare(b.nombre)));
          this.finishCatalogoSave(`Tipo "${nombre}" actualizado`);
        },
        error: (err) => this.failCatalogoSave(err, 'No se pudo actualizar el tipo de membresía')
      });
    } else {
      const createData: CreateTipoMembresiaDto = { nombre, descripcion };
      this.catalogosService.catalogosControllerCreateTipoMembresia(createData).subscribe({
        next: (created) => {
          this.tiposMembresia.update(list => [created, ...list].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          this.finishCatalogoSave(`Tipo "${nombre}" creado`);
        },
        error: (err) => this.failCatalogoSave(err, 'No se pudo crear el tipo de membresía')
      });
    }
  }

  private saveMedioPago(nombre: string, editing: MedioPagoResponseDto | null) {
    if (editing) {
      const updateData: UpdateMedioPagoDto = { nombre };
      this.catalogosService.catalogosControllerUpdateMedioPago(String(editing.id), updateData).subscribe({
        next: (updated) => {
          this.mediosPago.update(list => list.map(i => i.id === updated.id ? { ...i, ...updated } : i).sort((a, b) => a.nombre.localeCompare(b.nombre)));
          this.finishCatalogoSave(`Medio "${nombre}" actualizado`);
        },
        error: (err) => this.failCatalogoSave(err, 'No se pudo actualizar el medio de pago')
      });
    } else {
      const createData: CreateMedioPagoDto = { nombre };
      this.catalogosService.catalogosControllerCreateMedioPago(createData).subscribe({
        next: (created) => {
          this.mediosPago.update(list => [created, ...list].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          this.finishCatalogoSave(`Medio "${nombre}" creado`);
        },
        error: (err) => this.failCatalogoSave(err, 'No se pudo crear el medio de pago')
      });
    }
  }

  private finishCatalogoSave(message: string) {
    this.savingCatalogo.set(false);
    this.closeCatalogoModal();
    this.toast.success(message, { title: 'Guardado' });
  }

  private failCatalogoSave(err: unknown, fallback: string) {
    this.savingCatalogo.set(false);
    this.toast.error((err as any)?.error?.message || fallback, { title: 'Error' });
    console.error(err);
  }

  onDeleteCatalogo(item: TipoMembresiaResponseDto | MedioPagoResponseDto) {
    const tab = this.activeTab();

    if (tab === 'tipos') {
      const planes = this.cantidadPlanes(item.id);
      if (planes > 0) {
        this.toast.warning(`No se puede eliminar "${item.nombre}": tiene ${planes} plan(es) asociado(s)`, { title: 'Acción no permitida' });
        return;
      }
    }

    if (!confirm(`¿Desactivar "${item.nombre}"?`)) return;

    const eliminar = tab === 'tipos'
      ? this.catalogosService.catalogosControllerDesactivarTipoMembresia(String(item.id))
      : this.catalogosService.catalogosControllerDesactivarMedioPago(String(item.id));

    eliminar.subscribe({
      next: (deactivated: any) => {
        if (tab === 'tipos') {
          this.tiposMembresia.update(list => list.map(i => i.id === deactivated.id ? { ...i, ...deactivated } : i));
        } else {
          this.mediosPago.update(list => list.map(i => i.id === deactivated.id ? { ...i, ...deactivated } : i));
        }
        this.toast.success(`"${item.nombre}" desactivado`, { title: 'Desactivado' });
      },
      error: (err) => {
        this.toast.error((err as any)?.error?.message || 'No se pudo desactivar', { title: 'Error' });
        console.error('Error deactivating:', err);
      }
    });
  }

  // ============================================================
  // TAB 4 - USUARIOS DEL STAFF
  // ============================================================

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

  getUsuarioFullName(u: UsuarioResponseDto): string {
    return u.email;
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

  openNewUsuario() {
    this.editingUsuario.set(null);
    this.usuarioForm.reset({
      email: '',
      password: '',
      rol: 'recepcionista'
    });
    this.usuarioForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.usuarioForm.markAsUntouched();
    this.passwordVisible.set(false);
    this.showUsuarioModal.set(true);
  }

  openEditUsuario(u: UsuarioResponseDto) {
    if (!this.canEditUsuario(u)) {
      this.toast.warning('No se puede modificar una cuenta Super Admin', { title: 'Acción no permitida' });
      return;
    }

    this.editingUsuario.set(u);
    this.usuarioForm.patchValue({
      email: u.email,
      password: '',
      rol: u.rol
    });
    this.usuarioForm.get('password')?.clearValidators();
    this.usuarioForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
    this.usuarioForm.markAsUntouched();
    this.passwordVisible.set(false);
    this.showUsuarioModal.set(true);
  }

  closeUsuarioModal() {
    if (this.savingUsuario()) return;
    this.showUsuarioModal.set(false);
    this.editingUsuario.set(null);
    this.usuarioForm.reset();
    this.usuarioForm.get('password')?.setValidators([Validators.minLength(6)]);
    this.usuarioForm.get('password')?.updateValueAndValidity();
  }

  togglePassword() {
    this.passwordVisible.update(v => !v);
  }

  getUsuarioModalTitle(): string {
    return this.editingUsuario() ? 'Editar usuario' : 'Nuevo usuario';
  }

  onSaveUsuario() {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const editing = this.editingUsuario();
    if (!editing) {
      if (!this.usuarioForm.get('password')?.value) {
        this.usuarioForm.get('password')?.markAsTouched();
        return;
      }
    }

    this.savingUsuario.set(true);
    const formData = this.usuarioForm.getRawValue();

    if (editing) {
      const updateData: UpdateUsuarioDto = {
        email: formData.email,
        rol: formData.rol as RolUsuario
      };
      if (formData.password) updateData.password = formData.password;

      this.usuariosService.usuariosControllerUpdate(String(editing.id), updateData).subscribe({
        next: (updated) => this.finishUsuarioSave(updated, 'Usuario actualizado'),
        error: (err) => this.failUsuarioSave(err, 'No se pudo actualizar el usuario')
      });
    } else {
      const createData: CreateUsuarioDto = {
        email: formData.email,
        password: formData.password,
        rol: formData.rol as RolUsuario
      };

      this.usuariosService.usuariosControllerCreate(createData).subscribe({
        next: (created) => this.finishUsuarioSave(created, 'Usuario creado'),
        error: (err) => this.failUsuarioSave(err, 'No se pudo crear el usuario')
      });
    }
  }

  private finishUsuarioSave(saved: UsuarioResponseDto, message: string) {
    this.savingUsuario.set(false);
    this.usuarios.update(list => {
      const exists = list.some(u => u.id === saved.id);
      const next = exists ? list.map(u => u.id === saved.id ? saved : u) : [saved, ...list];
      return next.sort((a, b) => a.email.localeCompare(b.email));
    });
    this.closeUsuarioModal();
    this.toast.success(message, { title: 'Guardado' });
  }

  private failUsuarioSave(err: unknown, fallback: string) {
    this.savingUsuario.set(false);
    this.toast.error((err as any)?.error?.message || fallback, { title: 'Error' });
    console.error('Error saving usuario:', err);
  }

  onToggleUsuarioActivo(u: UsuarioResponseDto) {
    if (u.rol === 'super_admin') {
      this.toast.warning('No se puede modificar una cuenta Super Admin', { title: 'Acción no permitida' });
      return;
    }
    if (u.id === this.roleService.currentUserId()) {
      this.toast.warning('No podés desactivar tu propia cuenta', { title: 'Acción no permitida' });
      return;
    }

    if (u.activo) {
      if (!confirm(`¿Desactivar a ${this.getUsuarioFullName(u)}? No podrá iniciar sesión.`)) return;

      this.usuariosService.usuariosControllerDesactivar(String(u.id)).subscribe({
        next: (deactivated) => {
          this.usuarios.update(list => list.map(us => us.id === deactivated.id ? { ...us, ...deactivated } : us));
          this.toast.success(`${this.getUsuarioFullName(u)} desactivado`, { title: 'Desactivado' });
        },
        error: (err) => {
          this.toast.error((err as any)?.error?.message || 'No se pudo desactivar el usuario', { title: 'Error' });
          console.error('Error deactivating usuario:', err);
        }
      });
    } else {
      this.toast.info('La reactivación aún no está soportada por la API', { title: 'Sin cambios' });
    }
  }

  isCurrentUser(u: UsuarioResponseDto): boolean {
    return u.id === this.roleService.currentUserId();
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown() {
    if (this.showUsuarioModal()) {
      this.closeUsuarioModal();
    } else if (this.showCatalogoModal()) {
      this.closeCatalogoModal();
    }
  }
}