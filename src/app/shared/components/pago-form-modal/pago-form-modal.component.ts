import { ChangeDetectionStrategy, Component, inject, input, output, OnChanges, SimpleChanges, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { LucideAngularModule, X, Search, CheckCircle, Loader2, Calendar, DollarSign, CreditCard, Landmark, Wallet } from 'lucide-angular';
import { PagosService, CreatePagoDto, PagoResponseDto } from '@api';
import { SociosService, SocioResponseDto } from '@api';
import { MembresiasService, MembresiaResponseDto } from '@api';
import { CatalogosService, MedioPagoResponseDto } from '@api';
import { ToastService } from '@core/services/toast.service';
import { modalOverlay, modalPanel } from '@shared/utils/animations';

@Component({
  selector: 'app-pago-form-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  animations: [modalOverlay, modalPanel],
  templateUrl: './pago-form-modal.component.html'
})
export class PagoFormModalComponent implements OnChanges {
  open = input(false);
  socio = input<SocioResponseDto | null>(null);
  membresia = input<MembresiaResponseDto | null>(null);

  saved = output<PagoResponseDto>();
  dismissed = output<void>();

  private pagosService = inject(PagosService);
  private sociosService = inject(SociosService);
  private membresiasService = inject(MembresiasService);
  private catalogosService = inject(CatalogosService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  private socioSearch$ = new Subject<string>();

  readonly X = X;
  readonly Search = Search;
  readonly CheckCircle = CheckCircle;
  readonly Loader2 = Loader2;
  readonly Calendar = Calendar;
  readonly DollarSign = DollarSign;
  readonly CreditCard = CreditCard;
  readonly Landmark = Landmark;
  readonly Wallet = Wallet;

  selectedSocio = signal<SocioResponseDto | null>(null);
  socioResults = signal<SocioResponseDto[]>([]);
  socioSearching = signal(false);
  membresias = signal<MembresiaResponseDto[]>([]);
  mediosPago = signal<MedioPagoResponseDto[]>([]);
  saving = signal(false);

  pagoForm = this.fb.nonNullable.group({
    membresiaId: ['', [Validators.required]],
    medioPagoId: ['', [Validators.required]],
    monto: [0, [Validators.required, Validators.min(1)]],
    fechaPago: [this.today(), [Validators.required]]
  });

  constructor() {
    this.socioSearch$
      .pipe(takeUntilDestroyed(), debounceTime(300), distinctUntilChanged())
      .subscribe((term) => this.searchSocios(term));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && this.open()) {
      this.resetForOpen();
    }
  }

  resetForOpen() {
    const presetSocio = this.socio();
    const presetMem = this.membresia();

    this.pagoForm.reset({
      membresiaId: '',
      medioPagoId: this.mediosPago()[0]?.id || '',
      monto: 0,
      fechaPago: this.today()
    });
    this.saving.set(false);
    this.socioResults.set([]);
    this.selectedSocio.set(presetSocio);
    this.membresias.set([]);

    this.loadMediosPago();

    if (presetMem) {
      this.membresias.set([presetMem]);
      this.pagoForm.patchValue({ membresiaId: presetMem.id });
    } else if (presetSocio) {
      this.loadMembresiasForSocio(presetSocio.id);
    }
  }

  loadMediosPago() {
    this.catalogosService.catalogosControllerFindAllMediosPago().subscribe({
      next: (data) => this.mediosPago.set(data || []),
      error: () => console.error('Error loading medios de pago')
    });
  }

  loadMembresiasForSocio(socioId: string) {
    this.membresiasService.membresiasControllerFindAll(socioId, undefined, 50, 0).subscribe({
      next: (response) => {
        const data = response.data || [];
        const activas = data.filter((mem: any) => mem.estado === 'activa' || mem.estado === 'ACTIVA');
        this.membresias.set(activas);
        if (activas.length > 0 && !this.pagoForm.get('membresiaId')?.value) {
          this.pagoForm.patchValue({ membresiaId: String(activas[0].id) });
        }
      },
      error: () => console.error('Error loading membresias for socio')
    });
  }

  onSocioInputChange(event: Event) {
    const term = (event.target as HTMLInputElement).value.trim();
    if (!term) {
      this.socioResults.set([]);
      return;
    }
    this.socioSearch$.next(term);
  }

  searchSocios(term: string) {
    this.socioSearching.set(true);
    const searchParam = term ? term : undefined;
    this.sociosService.sociosControllerFindAll(undefined, undefined, undefined, searchParam, undefined, 6, 0).subscribe({
      next: (response) => {
        this.socioResults.set((response.data || []) as SocioResponseDto[]);
        this.socioSearching.set(false);
      },
      error: () => this.socioSearching.set(false)
    });
  }

  selectSocio(socio: SocioResponseDto) {
    this.selectedSocio.set(socio);
    this.socioResults.set([]);
    this.pagoForm.patchValue({ membresiaId: '' });
    this.loadMembresiasForSocio(socio.id);
  }

  clearSocio() {
    this.selectedSocio.set(null);
    this.socioResults.set([]);
    this.membresias.set([]);
    this.pagoForm.patchValue({ membresiaId: '' });
  }

  getMontoValido(): boolean {
    const monto = Number(this.pagoForm.get('monto')?.value);
    return !isNaN(monto) && monto > 0;
  }

  submit() {
    if (this.pagoForm.invalid) {
      this.pagoForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formData = this.pagoForm.getRawValue();
    const dto: CreatePagoDto = {
      membresiaId: String(formData.membresiaId),
      medioPagoId: String(formData.medioPagoId),
      monto: Number(formData.monto),
      fechaPago: formData.fechaPago
    };

    this.pagosService.pagosControllerCreate(dto).subscribe({
      next: (created) => {
        this.saving.set(false);
        this.toast.success('Pago registrado correctamente', { title: 'Registrado' });
        this.saved.emit(created);
        this.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Error al registrar el pago', { title: 'Error' });
        console.error('Error creating pago:', err);
      }
    });
  }

  close() {
    this.dismissed.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKeydown() {
    if (this.open()) {
      this.close();
    }
  }

  getMedioPagoIcon(nombre: string): any {
    const lower = nombre?.toLowerCase() || '';
    if (lower.includes('efectivo')) return this.DollarSign;
    if (lower.includes('tarjeta')) return this.CreditCard;
    if (lower.includes('transfer')) return this.Landmark;
    if (lower.includes('mercado')) return this.Wallet;
    return this.Wallet;
  }

  today(): string {
    return new Date().toISOString().split('T')[0];
  }
}