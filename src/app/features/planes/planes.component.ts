import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { LucideAngularModule, Calendar, Plus, Search, Filter, MoreVertical, ChevronLeft, ChevronRight, Edit, Trash2, DollarSign, Loader2, Shield, Star, Crown, CheckCircle, X } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { PlanesMembresiaService, PlanMembresiaResponseDto, CreatePlanMembresiaDto, UpdatePlanMembresiaDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './planes.component.html',
  styleUrl: './planes.component.css'
})
export class PlanesComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private planesService = inject(PlanesMembresiaService);
  private fb = inject(FormBuilder);

  readonly Calendar = Calendar;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly MoreVertical = MoreVertical;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly DollarSign = DollarSign;
  readonly Loader2 = Loader2;
  readonly Shield = Shield;
  readonly Star = Star;
  readonly Crown = Crown;
  readonly CheckCircle = CheckCircle;
  readonly X = X;

  planes = signal<PlanMembresiaResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  showModal = signal(false);
  editingPlan = signal<PlanMembresiaResponseDto | null>(null);
  saving = signal(false);

  planForm = this.fb.nonNullable.group({
    diasPorSemana: [5, [Validators.required, Validators.min(1), Validators.max(7)]],
    duracionDias: [30, [Validators.required, Validators.min(1)]],
    precio: [0, [Validators.required, Validators.min(0)]],
    tipoMembresiaId: ['', [Validators.required]],
    activo: [true]
  });

  ngOnInit() {
    this.layout.setPageTitle('Planes');
    this.loadPlanes();
  }

  loadPlanes() {
    this.loading.set(true);
    this.error.set(null);
    
    this.planesService.planesMembresiaControllerFindAllAdmin().subscribe({
      next: (data) => {
        this.planes.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los planes');
        this.loading.set(false);
        console.error('Error loading planes:', err);
      }
    });
  }

  filteredPlanes = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.planes().filter(p =>
      p.tipoMembresiaNombre?.toLowerCase().includes(term)
    );
  });

  paginatedPlanes = computed(() => {
    const filtered = this.filteredPlanes();
    const start = (this.currentPage() - 1) * this.pageSize;
    return filtered.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredPlanes().length / this.pageSize);
  });

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

  getPlanIcon(tipo: string): any {
    switch (tipo?.toLowerCase()) {
      case 'anual': return this.Crown;
      case 'trimestral': return this.Star;
      default: return this.Shield;
    }
  }

  getPlanIconClass(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'anual': return 'bg-secondary';
      case 'trimestral': return 'bg-tertiary';
      default: return 'bg-primary';
    }
  }

  getTipoBadgeClass(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'anual': return 'bg-warning-container text-on-warning-container border border-warning-dim';
      case 'trimestral': return 'bg-surface-container-high text-on-surface-variant border border-outline-variant';
      default: return 'bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed-dim';
    }
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

  openNewPlanModal() {
    this.editingPlan.set(null);
    this.planForm.reset({
      diasPorSemana: 5,
      duracionDias: 30,
      precio: 0,
      tipoMembresiaId: '',
      activo: true
    });
    this.showModal.set(true);
  }

  openEditPlanModal(plan: PlanMembresiaResponseDto) {
    this.editingPlan.set(plan);
    this.planForm.patchValue({
      diasPorSemana: plan.diasPorSemana,
      duracionDias: plan.duracionDias,
      precio: plan.precio,
      tipoMembresiaId: plan.tipoMembresiaId,
      activo: plan.activo
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingPlan.set(null);
    this.planForm.reset();
  }

  onSubmitPlan() {
    if (this.planForm.invalid) {
      this.planForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const planData = this.planForm.getRawValue() as CreatePlanMembresiaDto;
    const editing = this.editingPlan();

    if (editing) {
      const updateData: UpdatePlanMembresiaDto = {
        diasPorSemana: planData.diasPorSemana,
        duracionDias: planData.duracionDias,
        precio: planData.precio,
        tipoMembresiaId: planData.tipoMembresiaId
      };

      this.planesService.planesMembresiaControllerUpdate(String(editing.id), updateData).subscribe({
        next: (updated) => {
          this.planes.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.closeModal();
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar el plan');
          this.saving.set(false);
          console.error('Error updating plan:', err);
        }
      });
    } else {
      this.planesService.planesMembresiaControllerCreate(planData).subscribe({
        next: (created) => {
          this.planes.update(list => [created, ...list]);
          this.closeModal();
          this.saving.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear el plan');
          this.saving.set(false);
          console.error('Error creating plan:', err);
        }
      });
    }
  }

  onDeletePlan(plan: PlanMembresiaResponseDto) {
    if (confirm(`¿Desactivar el plan "${plan.tipoMembresiaNombre}"?`)) {
      this.planesService.planesMembresiaControllerDesactivar(String(plan.id)).subscribe({
        next: (deactivated) => {
          this.planes.update(list => list.map(p => p.id === deactivated.id ? deactivated : p));
        },
        error: (err) => {
          this.error.set('Error al desactivar el plan');
          console.error('Error deactivating plan:', err);
        }
      });
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
  }

  protected readonly Math = Math;
}