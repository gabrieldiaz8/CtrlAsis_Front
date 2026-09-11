import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { LucideAngularModule, Plus, Search, Filter, ChevronLeft, ChevronRight, Loader2, Calendar, User, MoreVertical, Edit, Trash2, Eye, RotateCcw, X, CheckCircle, AlertCircle, Clock, Shield } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { MembresiasService, MembresiaResponseDto, CreateMembresiaDto, UpdateMembresiaDto, MembresiasControllerCancelarRequest } from '@api';
import { SociosService, SocioResponseDto } from '@api';
import { PlanesMembresiaService, PlanMembresiaResponseDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-membresias',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './membresias.component.html',
  styleUrl: './membresias.component.css'
})
export class MembresiasComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private membresiasService = inject(MembresiasService);
  private sociosService = inject(SociosService);
  private planesService = inject(PlanesMembresiaService);
  private fb = inject(FormBuilder);

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

  membresias = signal<MembresiaResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  estadoFilter = signal<string>('');
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);
  
  showModal = signal(false);
  editingMembresia = signal<MembresiaResponseDto | null>(null);
  saving = signal(false);
  searchingSocio = signal(false);
  selectedSocio = signal<SocioResponseDto | null>(null);
  socioSearchTerm = signal('');

  planes = signal<PlanMembresiaResponseDto[]>([]);
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
      next: (data) => this.planes.set(data.filter(p => p.activo)),
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
        this.membresias.set(response.content || response);
        this.totalItems.set(response.totalElements || response.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar las membresías');
        this.loading.set(false);
        console.error('Error loading membresias:', err);
      }
    });
  }

  filteredMembresias = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.membresias().filter(m =>
      m.socioNombre?.toLowerCase().includes(term) ||
      m.socioDni?.includes(term) ||
      m.planNombre?.toLowerCase().includes(term) ||
      m.estado?.toLowerCase().includes(term)
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

  onEstadoFilterChange(event: Event) {
    this.estadoFilter.set((event.target as HTMLSelectElement).value);
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
    this.membresiaForm.reset();
  }

  searchSocio() {
    const term = this.socioSearchTerm().trim();
    if (!term) return;
    
    this.searchingSocio.set(true);
    this.sociosService.sociosControllerFindAll(term, term, term, undefined, 10, 0).subscribe({
      next: (response) => {
        const socios = response.content || response;
        if (socios.length > 0) {
          this.selectedSocio.set(socios[0]);
          this.membresiaForm.patchValue({ socioId: String(socios[0].id) });
        } else {
          this.selectedSocio.set(null);
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
    const membresiaData: CreateMembresiaDto = {
      socioId: String(formData.socioId),
      planId: String(formData.planId),
      fechaInicio: formData.fechaInicio,
      fechaFin: formData.fechaFin,
      estado: formData.estado as CreateMembresiaDto.EstadoEnum
    };

    this.membresiasService.membresiasControllerCreate(membresiaData).subscribe({
      next: (created) => {
        this.loadMembresias();
        this.closeModal();
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set('Error al crear la membresía');
        this.saving.set(false);
        console.error('Error creating membresia:', err);
      }
    });
  }

  renovarMembresia(membresia: MembresiaResponseDto) {
    if (confirm(`¿Renovar la membresía "${membresia.planNombre}" de ${membresia.socioNombre}? Se cerrará la actual y se creará una nueva.`)) {
      this.membresiasService.membresiasControllerRenovar(String(membresia.id)).subscribe({
        next: (renovada) => {
          this.membresias.update(list => list.map(m => m.id === renovada.id ? renovada : m));
        },
        error: (err) => {
          this.error.set('Error al renovar la membresía');
          console.error('Error renovating membresia:', err);
        }
      });
    }
  }

  cancelarMembresia(membresia: MembresiaResponseDto) {
    const motivo = prompt('Ingrese el motivo de la cancelación:');
    if (!motivo) return;
    
    if (confirm(`¿Cancelar la membresía "${membresia.planNombre}" de ${membresia.socioNombre}?`)) {
      const request: MembresiasControllerCancelarRequest = { motivo };
      this.membresiasService.membresiasControllerCancelar(String(membresia.id), request).subscribe({
        next: (cancelada) => {
          this.membresias.update(list => list.map(m => m.id === cancelada.id ? cancelada : m));
        },
        error: (err) => {
          this.error.set('Error al cancelar la membresía');
          console.error('Error canceling membresia:', err);
        }
      });
    }
  }

  viewMembresiaDetail(membresia: MembresiaResponseDto) {
    console.log('View membresia detail:', membresia.id);
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
    const diffMs = fin.getTime() - hoy.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  protected readonly Math = Math;
}