import { Component, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { MembresiaResponseDto } from '@api';
import { MembresiaEstadoHelper } from '../membresia-estado.helper';
import { IconRegistry } from '../icon-registry.service';

@Component({
  selector: 'app-historial-membresias',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, LucideAngularModule],
  template: `
    <div class="space-y-3" *ngIf="membresias().length > 0; else empty">
      <p class="text-label-sm font-medium text-on-surface-variant">Historial de membresías (más reciente primero)</p>
      <div class="divide-y divide-outline-variant border border-outline-variant rounded-lg overflow-hidden">
        @for (m of membresias(); track m.id) {
          <div class="p-4 bg-surface-container-lowest hover:bg-surface-container/50 transition-colors">
            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm border whitespace-nowrap"
                      [class]="clasesEstado(helper.calcular(m))">
                  <lucide-icon [img]="icon(iconoNombre(helper.calcular(m)))" class="w-3.5 h-3.5"></lucide-icon>
                  {{ etiquetaEstado(helper.calcular(m)) }}
                </span>
                @if (m.estado !== helper.calcular(m)) {
                  <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                    <lucide-icon [img]="icon('clock')" class="w-3 h-3"></lucide-icon>
                    Persistida: {{ m.estado }}
                  </span>
                }
              </div>
              <span class="text-label-sm text-on-surface-variant whitespace-nowrap">
                {{ m.fechaCreacion | date:'dd/MM/yyyy HH:mm':'UTC' }}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-label-sm text-on-surface-variant mb-2">
              <span class="flex items-center gap-1">
                <lucide-icon [img]="icon('calendar')" class="w-3.5 h-3.5"></lucide-icon>
                {{ m.fechaInicio | date:'dd/MM/yyyy':'UTC' }} → {{ m.fechaFin | date:'dd/MM/yyyy':'UTC' }}
              </span>
              <span>{{ m.diasPorSemana }} días/semana</span>
              <span>{{ m.planNombre }}</span>
              <span>{{ planTipo(m.planId) }}</span>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant">
              <div class="flex items-center gap-1.5">
                @if (m.estado === 'activa') {
                  <button type="button" (click)="onRenovar(m)" class="micro-btn px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium">
                    <lucide-icon [img]="icon('rotate-ccw')" class="w-3.5 h-3.5"></lucide-icon>
                    Renovar
                  </button>
                  <button type="button" (click)="onCambiarPlan(m)" class="micro-btn px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant">
                    <lucide-icon [img]="icon('shield')" class="w-3.5 h-3.5"></lucide-icon>
                    Cambiar plan
                  </button>
                  <button type="button" (click)="onCancelar(m)" class="micro-btn px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant">
                    <lucide-icon [img]="icon('x-circle')" class="w-3.5 h-3.5"></lucide-icon>
                    Cancelar
                  </button>
                  <button type="button" (click)="onRegistrarPago(m)" class="micro-btn px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant">
                    <lucide-icon [img]="icon('credit-card')" class="w-3.5 h-3.5"></lucide-icon>
                    Pago
                  </button>
                }
                <button type="button" (click)="onVerPagos(m)" class="micro-btn px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium border border-outline-variant">
                  <lucide-icon [img]="icon('eye')" class="w-3.5 h-3.5"></lucide-icon>
                  Ver pagos
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <ng-template #empty>
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <lucide-icon [img]="icon('shield')" class="w-12 h-12 mb-3 text-on-surface-variant/30"></lucide-icon>
        <p class="text-body-md font-medium text-on-surface">Sin historial de membresías</p>
        <p class="text-body-sm mt-1 text-on-surface-variant">Las membresías creadas aparecerán aquí</p>
      </div>
    </ng-template>
  `,
})
export class HistorialMembresiasComponent {
  helper = inject(MembresiaEstadoHelper);
  icons = inject(IconRegistry);

  membresias = input.required<MembresiaResponseDto[]>();
  planes = input.required<any[]>();

  renovar = output<MembresiaResponseDto>();
  cambiarPlan = output<MembresiaResponseDto>();
  cancelar = output<MembresiaResponseDto>();
  registrarPago = output<MembresiaResponseDto>();
  verPagos = output<MembresiaResponseDto>();

  iconoNombre(estado: string): string {
    switch (estado) {
      case 'activa': return 'check-circle';
      case 'vencida': return 'calendar-clock';
      case 'suspendida': return 'pause-circle';
      case 'cancelada': return 'ban';
      default: return 'circle-slash';
    }
  }

  clasesEstado(estado: string): string {
    switch (estado) {
      case 'activa': return 'bg-success-container text-on-success-container border-success';
      case 'vencida': return 'bg-warning-container text-on-warning-container border-warning';
      case 'suspendida': return 'bg-primary-container text-on-primary-container border-primary';
      case 'cancelada': return 'bg-error-container text-on-error-container border-error';
      default: return 'bg-surface-container-highest text-on-surface-variant border-outline-variant';
    }
  }

  etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'activa': return 'Activa';
      case 'vencida': return 'Vencida';
      case 'suspendida': return 'Suspendida';
      case 'cancelada': return 'Cancelada';
      default: return 'Sin membresía';
    }
  }

  planTipo(planId: string | undefined): string {
    if (!planId) return '—';
    const plan = this.planes().find(p => p.id === planId);
    return plan?.tipoMembresiaNombre || '—';
  }

  onRenovar(m: MembresiaResponseDto) { this.renovar.emit(m); }
  onCambiarPlan(m: MembresiaResponseDto) { this.cambiarPlan.emit(m); }
  onCancelar(m: MembresiaResponseDto) { this.cancelar.emit(m); }
  onRegistrarPago(m: MembresiaResponseDto) { this.registrarPago.emit(m); }
  onVerPagos(m: MembresiaResponseDto) { this.verPagos.emit(m); }

  icon(nombre: string): LucideIconData | undefined {
    return this.icons.get(nombre);
  }
}