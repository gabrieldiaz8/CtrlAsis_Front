import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { LucideAngularModule, Plus, Search, ChevronLeft, ChevronRight, Loader2, MoreVertical, Edit, Trash2, X, CheckCircle, Tag, CreditCard, BadgeCheck, Tag as TagIcon, Loader } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { CatalogosService, RubroResponseDto, MedioPagoResponseDto, TipoMembresiaResponseDto, CreateRubroDto, CreateMedioPagoDto, CreateTipoMembresiaDto, UpdateRubroDto, UpdateMedioPagoDto, UpdateTipoMembresiaDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

type CatalogoType = 'rubros' | 'medios-pago' | 'tipos-membresia';

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './catalogos.component.html',
  styleUrl: './catalogos.component.css'
})
export class CatalogosComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private catalogosService = inject(CatalogosService);
  private fb = inject(FormBuilder);

  readonly Plus = Plus;
  readonly Search = Search;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Loader2 = Loader2;
  readonly MoreVertical = MoreVertical;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Tag = TagIcon;
  readonly CreditCard = CreditCard;
  readonly BadgeCheck = BadgeCheck;

  activeTab = signal<CatalogoType>('rubros');
  readonly tabOptions: CatalogoType[] = ['rubros', 'medios-pago', 'tipos-membresia'];
  loading = signal(true);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);
  
  showModal = signal(false);
  editingItem = signal<any | null>(null);
  saving = signal(false);

  rubros = signal<RubroResponseDto[]>([]);
  mediosPago = signal<MedioPagoResponseDto[]>([]);
  tiposMembresia = signal<TipoMembresiaResponseDto[]>([]);

  // Single form with all possible fields
  catalogoForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    descripcion: [''],
    activo: [true]
  });

  ngOnInit() {
    this.layout.setPageTitle('Catálogos');
    this.loadAllCatalogs();
  }

  loadAllCatalogs() {
    this.loading.set(true);
    
    this.catalogosService.catalogosControllerFindAllRubrosAdmin().subscribe({
      next: (data) => this.rubros.set(data),
      error: () => console.error('Error loading rubros')
    });

    this.catalogosService.catalogosControllerFindAllMediosPagoAdmin().subscribe({
      next: (data) => this.mediosPago.set(data),
      error: () => console.error('Error loading medios de pago')
    });

    this.catalogosService.catalogosControllerFindAllTiposMembresiaAdmin().subscribe({
      next: (data) => {
        this.tiposMembresia.set(data);
        this.loading.set(false);
      },
      error: () => {
        console.error('Error loading tipos membresia');
        this.loading.set(false);
      }
    });
  }

  get currentItems() {
    switch (this.activeTab()) {
      case 'rubros': return this.rubros();
      case 'medios-pago': return this.mediosPago();
      case 'tipos-membresia': return this.tiposMembresia();
    }
  }

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.currentItems.filter(item =>
      item.nombre?.toLowerCase().includes(term) ||
      (item as any).descripcion?.toLowerCase().includes(term)
    );
  });

  totalPages = computed(() => Math.ceil(this.filteredItems().length / this.pageSize));

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

  getTabConfig() {
    const configs: Record<CatalogoType, { label: string; icon: any; count: number }> = {
      'rubros': { label: 'Rubros', icon: this.Tag, count: this.rubros().length },
      'medios-pago': { label: 'Medios de Pago', icon: this.CreditCard, count: this.mediosPago().length },
      'tipos-membresia': { label: 'Tipos de Membresía', icon: this.BadgeCheck, count: this.tiposMembresia().length }
    };
    return configs[this.activeTab()];
  }

  onTabChange(tab: CatalogoType) {
    this.activeTab.set(tab);
    this.searchTerm.set('');
    this.currentPage.set(1);
  }

  onSearchChange(event: Event) {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onPageChange(page: number) {
    if (page === -1 || page === -2) return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  paginatedItems = computed(() => {
    const filtered = this.filteredItems();
    const start = (this.currentPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  openNewModal() {
    this.editingItem.set(null);
    this.catalogoForm.reset({
      nombre: '',
      descripcion: '',
      activo: true
    });
    this.showModal.set(true);
  }

  openEditModal(item: any) {
    this.editingItem.set(item);
    this.catalogoForm.patchValue({
      nombre: item.nombre,
      descripcion: (item as any).descripcion || '',
      activo: item.activo
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingItem.set(null);
    this.catalogoForm.reset({ nombre: '', descripcion: '', activo: true });
  }

  onSubmit() {
    if (this.catalogoForm.invalid) {
      this.catalogoForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData = this.catalogoForm.getRawValue();
    const editing = this.editingItem();
    const tab = this.activeTab();

    const createFn = tab === 'rubros' 
      ? this.catalogosService.catalogosControllerCreateRubro.bind(this.catalogosService)
      : tab === 'medios-pago'
        ? this.catalogosService.catalogosControllerCreateMedioPago.bind(this.catalogosService)
        : this.catalogosService.catalogosControllerCreateTipoMembresia.bind(this.catalogosService);

    const updateFn = tab === 'rubros'
      ? this.catalogosService.catalogosControllerUpdateRubro.bind(this.catalogosService)
      : tab === 'medios-pago'
        ? this.catalogosService.catalogosControllerUpdateMedioPago.bind(this.catalogosService)
        : this.catalogosService.catalogosControllerUpdateTipoMembresia.bind(this.catalogosService);

    const desactivarFn = tab === 'rubros'
      ? this.catalogosService.catalogosControllerDesactivarRubro.bind(this.catalogosService)
      : tab === 'medios-pago'
        ? this.catalogosService.catalogosControllerDesactivarMedioPago.bind(this.catalogosService)
        : this.catalogosService.catalogosControllerDesactivarTipoMembresia.bind(this.catalogosService);

    const getListSignal = tab === 'rubros' ? this.rubros : tab === 'medios-pago' ? this.mediosPago : this.tiposMembresia;

    if (editing) {
      const updateData: UpdateRubroDto | UpdateMedioPagoDto | UpdateTipoMembresiaDto = {
        nombre: formData.nombre
      };

      if (tab === 'tipos-membresia') {
        (updateData as UpdateTipoMembresiaDto).descripcion = formData.descripcion;
      }

      updateFn(String(editing.id), updateData).subscribe({
        next: (updated) => {
          getListSignal.update(list => list.map(i => i.id === updated.id ? updated : i));
          this.closeModal();
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error updating:', err);
        }
      });
    } else {
      let createData: CreateRubroDto | CreateMedioPagoDto | CreateTipoMembresiaDto;

      if (tab === 'tipos-membresia') {
        createData = {
          nombre: formData.nombre,
          descripcion: formData.descripcion
        } as CreateTipoMembresiaDto;
      } else {
        createData = {
          nombre: formData.nombre
        } as CreateRubroDto | CreateMedioPagoDto;
      }

      createFn(createData).subscribe({
        next: (created) => {
          getListSignal.update(list => [created, ...list]);
          this.closeModal();
          this.saving.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          console.error('Error creating:', err);
        }
      });
    }
  }

  onDelete(item: any) {
    const tab = this.activeTab();
    const desactivarFn = tab === 'rubros'
      ? this.catalogosService.catalogosControllerDesactivarRubro.bind(this.catalogosService)
      : tab === 'medios-pago'
        ? this.catalogosService.catalogosControllerDesactivarMedioPago.bind(this.catalogosService)
        : this.catalogosService.catalogosControllerDesactivarTipoMembresia.bind(this.catalogosService);

    const getListSignal = tab === 'rubros' ? this.rubros : tab === 'medios-pago' ? this.mediosPago : this.tiposMembresia;

    if (confirm(`¿Desactivar "${item.nombre}"?`)) {
      desactivarFn(String(item.id)).subscribe({
        next: (deactivated) => {
          getListSignal.update(list => list.map(i => i.id === deactivated.id ? deactivated : i));
        },
        error: (err) => console.error('Error deactivating:', err)
      });
    }
  }

  getTabIcon(tab: CatalogoType): any {
    switch (tab) {
      case 'rubros': return this.Tag;
      case 'medios-pago': return this.CreditCard;
      case 'tipos-membresia': return this.BadgeCheck;
    }
  }

  getDescripcion(item: any): string {
    return (item as any).descripcion || '-';
  }

  protected readonly Math = Math;
}