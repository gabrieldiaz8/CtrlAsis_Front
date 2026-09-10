import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { LucideAngularModule, Plus, Search, Filter, ChevronLeft, ChevronRight, Loader2, CreditCard, DollarSign, Calendar, User, MoreVertical, Edit, Trash2, Eye, ArrowLeft, ArrowRight, X, CheckCircle, Radio } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { PagosService, PagoResponseDto, CreatePagoDto } from '@api';
import { SociosService, SocioResponseDto } from '@api';
import { MembresiasService, MembresiaResponseDto } from '@api';
import { CatalogosService, MedioPagoResponseDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pagos.component.html',
  styleUrl: './pagos.component.css'
})
export class PagosComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private pagosService = inject(PagosService);
  private sociosService = inject(SociosService);
  private membresiasService = inject(MembresiasService);
  private catalogosService = inject(CatalogosService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly Plus = Plus;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly Loader2 = Loader2;
  readonly CreditCard = CreditCard;
  readonly DollarSign = DollarSign;
  readonly Calendar = Calendar;
  readonly User = User;
  readonly MoreVertical = MoreVertical;
  readonly Edit = Edit;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly X = X;
  readonly CheckCircle = CheckCircle;
  readonly Radio = Radio;

  pagos = signal<PagoResponseDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);
  
  showModal = signal(false);
  modalMode = signal<'list' | 'create'>('list');
  editingPago = signal<PagoResponseDto | null>(null);
  saving = signal(false);
  searchingSocio = signal(false);
  selectedSocio = signal<SocioResponseDto | null>(null);
  socioSearchTerm = signal('');

  membresias = signal<MembresiaResponseDto[]>([]);
  mediosPago = signal<MedioPagoResponseDto[]>([]);
  loadingCatalogs = signal(false);

  pagoForm = this.fb.nonNullable.group({
    membresiaId: ['', [Validators.required]],
    medioPagoId: ['', [Validators.required]],
    monto: [0, [Validators.required, Validators.min(1)]],
    fechaPago: [new Date().toISOString().split('T')[0], [Validators.required]]
  });

  ngOnInit() {
    this.layout.setPageTitle('Pagos');
    this.loadCatalogs();
    this.loadPagos();
  }

  loadCatalogs() {
    this.loadingCatalogs.set(true);
    
    this.membresiasService.membresiasControllerFindAll(undefined, undefined, 100, 0).subscribe({
      next: (response) => {
        const data = response.content || response;
        this.membresias.set(data.filter((mem: any) => mem.estado === 'activa' || mem.estado === 'ACTIVA'));
      },
      error: () => console.error('Error loading membresias')
    });

    this.catalogosService.catalogosControllerFindAllMediosPago().subscribe({
      next: (data) => this.mediosPago.set(data),
      error: () => console.error('Error loading medios de pago')
    });

    setTimeout(() => this.loadingCatalogs.set(false), 300);
  }

  loadPagos() {
    this.loading.set(true);
    this.error.set(null);
    
    this.pagosService.pagosControllerFindAll(undefined, undefined, this.pageSize, this.currentPage() - 1).subscribe({
      next: (response) => {
        this.pagos.set(response.content || response);
        this.totalItems.set(response.totalElements || response.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar los pagos');
        this.loading.set(false);
        console.error('Error loading pagos:', err);
      }
    });
  }

  filteredPagos = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.pagos().filter(p =>
      p.socioNombre?.toLowerCase().includes(term) ||
      p.socioDni?.includes(term) ||
      p.planNombre?.toLowerCase().includes(term) ||
      p.medioPagoNombre?.toLowerCase().includes(term)
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

  onPageChange(page: number) {
    if (page === -1 || page === -2) return;
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPagos();
    }
  }

  openNewPagoModal() {
    this.modalMode.set('create');
    this.editingPago.set(null);
    this.selectedSocio.set(null);
    this.socioSearchTerm.set('');
    this.pagoForm.reset({
      membresiaId: '',
      medioPagoId: this.mediosPago()[0]?.id || '',
      monto: 0,
      fechaPago: new Date().toISOString().split('T')[0]
    });
    this.showModal.set(true);
  }

  openEditPagoModal(pago: PagoResponseDto) {
    this.modalMode.set('create');
    this.editingPago.set(pago);
    this.pagoForm.patchValue({
      membresiaId: String(pago.membresiaId),
      medioPagoId: String(pago.medioPagoId),
      monto: pago.monto,
      fechaPago: pago.fechaPago?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingPago.set(null);
    this.selectedSocio.set(null);
    this.pagoForm.reset();
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
          this.loadMembresiasForSocio(socios[0].id);
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

  loadMembresiasForSocio(socioId: string) {
    this.membresiasService.membresiasControllerFindAll(socioId, undefined, 50, 0).subscribe({
      next: (response) => {
        const data = response.content || response;
        const activeMembresias = data.filter((mem: any) => mem.estado === 'activa' || mem.estado === 'ACTIVA');
        this.membresias.set(activeMembresias);
        if (activeMembresias.length > 0 && !this.pagoForm.get('membresiaId')?.value) {
          this.pagoForm.patchValue({ membresiaId: String(activeMembresias[0].id) });
        }
      },
      error: () => console.error('Error loading membresias for socio')
    });
  }

  onSubmitPago() {
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData = this.pagoForm.getRawValue();
    const pagoData: CreatePagoDto = {
      membresiaId: String(formData.membresiaId),
      medioPagoId: String(formData.medioPagoId),
      monto: formData.monto,
      fechaPago: formData.fechaPago
    };

    this.pagosService.pagosControllerCreate(pagoData).subscribe({
      next: (created) => {
        this.loadPagos();
        this.closeModal();
        this.saving.set(false);
      },
      error: (err) => {
        this.error.set('Error al registrar el pago');
        this.saving.set(false);
        console.error('Error creating pago:', err);
      }
    });
  }

  onDeletePago(pago: PagoResponseDto) {
    if (confirm(`¿Eliminar el pago de $${pago.monto} a ${pago.socioNombre}?`)) {
      console.log('Delete pago:', pago.id);
    }
  }

  viewPagoDetail(pago: PagoResponseDto) {
    console.log('View pago detail:', pago.id);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price);
  }

  formatDate(date: string | Date | undefined): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  getMedioPagoIcon(nombre: string): any {
    const lower = nombre?.toLowerCase() || '';
    if (lower.includes('efectivo')) return this.DollarSign;
    if (lower.includes('tarjeta')) return this.CreditCard;
    if (lower.includes('transfer')) return this.ArrowLeft;
    return this.DollarSign;
  }

  protected readonly Math = Math;
}