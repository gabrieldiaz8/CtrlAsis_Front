import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, DoorOpen, Badge, CheckCircle, XCircle, Info, AlertTriangle, BadgeCheck, Loader2, Clock, RefreshCw } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { AccesosService, ValidarAccesoDto, AccesoResponseDto } from '@api';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { fadeZoom } from '@shared/utils/animations';

interface SocioAcceso {
  nombre: string;
  dni: string;
  observacion: string;
}

type ResultadoAcceso = 'permitido' | 'rechazado' | 'excepcion' | 'excepcion_confirmada' | null;

@Component({
  selector: 'app-acceso',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ReactiveFormsModule, CommonModule],
  animations: [fadeZoom],
  templateUrl: './acceso.component.html',
  styleUrl: './acceso.component.css'
})
export class AccesoComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private fb = inject(FormBuilder);
  private accesosService = inject(AccesosService);
  private toast = inject(ToastService);

  readonly DoorOpen = DoorOpen;
  readonly Badge = Badge;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Info = Info;
  readonly AlertTriangle = AlertTriangle;
  readonly BadgeCheck = BadgeCheck;
  readonly Loader2 = Loader2;
  readonly Clock = Clock;
  readonly RefreshCw = RefreshCw;

  checkinForm = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]]
  });

  observacionControl = new FormControl('');

  loading = signal(false);
  forzandoIngreso = signal(false);
  resultState = signal<ResultadoAcceso>(null);
  socio = signal<SocioAcceso | null>(null);
  ultimoAccesoId = signal<string | null>(null);

  accesosHoy = signal<AccesoResponseDto[]>([]);
  accesosLoading = signal(true);
  accesosError = signal<string | null>(null);

  ngOnInit() {
    this.layout.setPageTitle('Control de Acceso');
    this.loadAccesosHoy();
  }

  loadAccesosHoy() {
    this.accesosLoading.set(true);
    this.accesosError.set(null);

    this.accesosService.accesosControllerFindHoy().subscribe({
      next: (accesos) => {
        this.accesosHoy.set(accesos || []);
        this.accesosLoading.set(false);
      },
      error: (err) => {
        this.accesosError.set('No se pudieron cargar los accesos de hoy');
        this.accesosLoading.set(false);
        console.error('Error loading accesos de hoy:', err);
      }
    });
  }

  onValidate() {
    if (this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.resultState.set(null);
    this.ultimoAccesoId.set(null);

    const dni = this.checkinForm.value.dni!;

    this.accesosService.accesosControllerValidar({ dni } as ValidarAccesoDto).subscribe({
      next: (response: AccesoResponseDto) => {
        this.loading.set(false);
        this.handleResponse(response);
        this.notifyResult(response);
        this.loadAccesosHoy();
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Error al validar acceso', { title: 'Error' });
        console.error(err);
      }
    });
  }

  onForzarIngreso() {
    const id = this.ultimoAccesoId();
    if (!id) {
      this.toast.warning('No hay un acceso pendiente para forzar el ingreso');
      return;
    }

    this.forzandoIngreso.set(true);

    const observacion = this.observacionControl.value?.trim() || 'Autorizado por recepción';

    this.accesosService.accesosControllerExcepcion(id, { observacion }).subscribe({
      next: (response: AccesoResponseDto) => {
        this.forzandoIngreso.set(false);
        this.applyResponse(response);
        this.resultState.set('excepcion_confirmada');
        this.toast.success('Ingreso registrado por excepción', { title: 'Excepción confirmada' });
        this.loadAccesosHoy();
      },
      error: (err: any) => {
        this.forzandoIngreso.set(false);
        this.toast.error(err.error?.message || 'Error al registrar la excepción', { title: 'Error' });
        console.error(err);
      }
    });
  }

  private notifyResult(response: AccesoResponseDto) {
    switch (response.resultado) {
      case 'permitido':
        this.toast.success(`Acceso permitido para ${response.socioNombre || 'el socio'}`, { title: 'Validación OK' });
        break;
      case 'excepcion':
        this.toast.warning('Se requiere revisión y autorización para permitir el ingreso', { title: 'Revisión requerida' });
        break;
      default:
        this.toast.error('El socio no cuenta con un acceso válido en este momento', { title: 'Acceso denegado' });
        break;
    }
  }

  private handleResponse(response: AccesoResponseDto) {
    if (response.resultado === 'permitido') {
      this.resultState.set('permitido');
    } else if (response.resultado === 'excepcion') {
      this.resultState.set('excepcion');
    } else {
      this.resultState.set('rechazado');
    }
    this.applyResponse(response);
  }

  private applyResponse(response: AccesoResponseDto) {
    this.ultimoAccesoId.set(response.id);
    this.socio.set({
      nombre: response.socioNombre || '',
      dni: response.socioDni || '',
      observacion: response.observacion || ''
    });
  }

  getInitials(nombreCompleto: string): string {
    const partes = nombreCompleto?.trim().split(/\s+/);
    const primera = partes?.[0] || '';
    const ultima = partes?.[partes.length - 1] || '';
    return primera.charAt(0) + ultima.charAt(0);
  }

  getAvatarColor(id: string): string {
    const numId = parseInt(id, 10) || 0;
    const colors = ['bg-primary-fixed-dim text-on-primary-fixed-variant', 'bg-secondary-container text-on-secondary-container', 'bg-tertiary-container text-on-tertiary-container'];
    return colors[numId % colors.length];
  }

  getResultadoBadge(resultado: string): { class: string, icon: any, label: string } {
    switch (resultado) {
      case 'permitido':
        return { class: 'bg-success-container text-on-success-container border border-success', icon: CheckCircle, label: 'Permitido' };
      case 'rechazado':
        return { class: 'bg-error-container text-on-error-container border border-error', icon: XCircle, label: 'Rechazado' };
      case 'excepcion':
        return { class: 'bg-warning-container text-on-warning-container border border-warning-dim', icon: AlertTriangle, label: 'Excepción' };
      default:
        return { class: 'bg-surface-container-high text-on-surface-variant border border-outline-variant', icon: Info, label: resultado };
    }
  }

  formatHora(fechaHora: string | Date | undefined): string {
    if (!fechaHora) return '-';
    return new Date(fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
}