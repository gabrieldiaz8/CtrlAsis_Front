import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, AlertTriangle, CheckCircle, Clock, DoorOpen, Info, RefreshCw, XCircle } from 'lucide-angular';
import { AccesoResponseDto } from '@api';

@Component({
  selector: 'app-accesos-hoy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule],
  templateUrl: './accesos-hoy.component.html'
})
export class AccesosHoyComponent {
  readonly accesos = input<AccesoResponseDto[]>([]);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly onReload = input<() => void>(() => undefined);

  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly DoorOpen = DoorOpen;
  readonly Info = Info;
  readonly RefreshCw = RefreshCw;
  readonly XCircle = XCircle;

  /** Los rechazos se destacan para que el operador los vea de un vistazo. */
  readonly rechazados = computed(() => this.accesos().filter(a => a.resultado === 'rechazado').length);

  socioLabel(acceso: AccesoResponseDto): string {
    if (!acceso.socioId) return 'DNI no registrado';
    return acceso.socioNombre?.trim() || 'Socio sin nombre';
  }

  dniLabel(acceso: AccesoResponseDto): string {
    return acceso.socioDni?.trim() || '—';
  }

  formatHora(fechaHora: string | Date | undefined): string {
    if (!fechaHora) return '—';
    return new Date(fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
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
}