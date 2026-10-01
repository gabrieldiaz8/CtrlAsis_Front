import { Component, input, output, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { MembresiaResponseDto } from '@api';
import { MembresiaEstadoHelper, EstadoCalculadoMembresia } from '../membresia-estado.helper';
import { IconRegistry } from '../icon-registry.service';

@Component({
  selector: 'app-membresia-actual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, LucideAngularModule],
  template: `
    @if (resumen(); as r) {
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="p-3 rounded-xl bg-success-container/20 border border-success/30">
              <lucide-icon [img]="icon('check-circle')" class="w-6 h-6 text-success"></lucide-icon>
            </div>
            <div>
              <h3 class="text-body-md font-semibold text-on-surface">Membresía actual</h3>
              <p class="text-label-sm text-on-surface-variant">
                {{ r.planNombre }} · {{ planTipo() }} · {{ r.diasPorSemana }} días/semana
              </p>
            </div>
          </div>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-sm border whitespace-nowrap shrink-0"
                [class]="'border-' + estadoCalculado()">
            <lucide-icon [img]="icon(iconoNombre())" class="w-3.5 h-3.5"></lucide-icon>
            {{ etiqueta() }}
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div class="bg-surface rounded-lg p-3 border border-outline-variant">
            <p class="text-label-sm text-on-surface-variant">Inicio</p>
            <p class="text-body-md font-medium text-on-surface">{{ r.fechaInicio | date:'dd/MM/yyyy':'UTC' }}</p>
          </div>
          <div class="bg-surface rounded-lg p-3 border border-outline-variant">
            <p class="text-label-sm text-on-surface-variant">Vence</p>
            <p class="text-body-md font-medium text-on-surface" [class.text-warning]="diasRestantes() <= 7 && estadoCalculado() === 'activa'">
              {{ r.fechaFin | date:'dd/MM/yyyy':'UTC' }}
            </p>
          </div>
          <div class="bg-surface rounded-lg p-3 border border-outline-variant">
            <p class="text-label-sm text-on-surface-variant">Estado</p>
            <p class="text-body-md font-medium text-on-surface">{{ etiqueta() }}</p>
          </div>
          <div class="bg-surface rounded-lg p-3 border border-outline-variant" *ngIf="estadoCalculado() === 'activa'">
            <p class="text-label-sm text-on-surface-variant">Días restantes</p>
            <p class="text-headline-md font-bold text-on-surface" [class.text-warning]="diasRestantes() <= 7">
              {{ diasRestantes() }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant">
          @if (estadoCalculado() === 'activa') {
            <button type="button" (click)="renovar.emit()" class="micro-btn bg-secondary hover:bg-secondary-container text-on-secondary py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium">
              <lucide-icon [img]="icon('rotate-ccw')" class="w-4 h-4"></lucide-icon>
              Renovar
            </button>
            <button type="button" (click)="cambiarPlan.emit()" class="micro-btn bg-primary-container hover:bg-primary-container/90 text-on-primary-container py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium">
              <lucide-icon [img]="icon('shield')" class="w-4 h-4"></lucide-icon>
              Cambiar de plan
            </button>
            <button type="button" (click)="cancelar.emit()" class="micro-btn bg-error-container hover:bg-error-container/90 text-on-error-container py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium">
              <lucide-icon [img]="icon('x-circle')" class="w-4 h-4"></lucide-icon>
              Cancelar
            </button>
            <button type="button" (click)="registrarPago.emit()" class="micro-btn bg-surface-container-high hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium border border-outline-variant">
              <lucide-icon [img]="icon('credit-card')" class="w-4 h-4"></lucide-icon>
              Registrar pago
            </button>
          } @else if (estadoCalculado() === 'vencida') {
            <button type="button" (click)="renovar.emit()" class="micro-btn bg-secondary hover:bg-secondary-container text-on-secondary py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium">
              <lucide-icon [img]="icon('rotate-ccw')" class="w-4 h-4"></lucide-icon>
              Renovar
            </button>
          } @else if (estadoCalculado() === 'suspendida' || estadoCalculado() === 'cancelada') {
            <button type="button" (click)="nueva.emit()" class="micro-btn bg-secondary hover:bg-secondary-container text-on-secondary py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium">
              <lucide-icon [img]="icon('plus')" class="w-4 h-4"></lucide-icon>
              Nueva membresía
            </button>
          }
          <button type="button" (click)="verHistorial.emit()" class="micro-btn ml-auto bg-surface-container-high hover:bg-surface-container text-on-surface py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium border border-outline-variant">
            <lucide-icon [img]="icon('eye')" class="w-4 h-4"></lucide-icon>
            Ver historial
          </button>
        </div>
      </div>
    } @else {
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 text-center space-y-4">
        <lucide-icon [img]="icon('circle-slash')" class="w-14 h-14 mx-auto text-on-surface-variant/40"></lucide-icon>
        <div>
          <p class="text-body-md font-medium text-on-surface">Sin membresía activa</p>
          <p class="text-label-sm text-on-surface-variant mt-1">Este socio no tiene una membresía vigente</p>
        </div>
        <button type="button" (click)="nueva.emit()" class="micro-btn bg-secondary hover:bg-secondary-container text-on-secondary py-2 px-4 rounded-lg flex items-center gap-2 text-label-md font-medium mx-auto">
          <lucide-icon [img]="icon('plus')" class="w-4 h-4"></lucide-icon>
          Asignar membresía
        </button>
      </div>
    }
  `,
})
export class MembresiaActualComponent {
  private helper = inject(MembresiaEstadoHelper);
  private icons = inject(IconRegistry);

  resumen = input.required<MembresiaResponseDto | null>();
  planes = input.required<any[]>();

  renovar = output<void>();
  cambiarPlan = output<void>();
  cancelar = output<void>();
  registrarPago = output<void>();
  nueva = output<void>();
  verHistorial = output<void>();

  planTipo = computed(() => {
    const r = this.resumen();
    if (!r) return '—';
    const plan = this.planes().find(p => p.id === r.planId);
    return plan?.tipoMembresiaNombre || '—';
  });

  estadoCalculado = computed(() => this.helper.calcular(this.resumen()));
  etiqueta = computed(() => this.helper.etiqueta(this.estadoCalculado()));
  iconoNombre = computed(() => this.helper.iconoNombre(this.estadoCalculado()));
  diasRestantes = computed(() => {
    const r = this.resumen();
    if (!r || !r.fechaFin) return 0;
    const fin = new Date(r.fechaFin);
    fin.setHours(0, 0, 0, 0);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((fin.getTime() - hoy.getTime()) / 86400000));
  });

  icon(nombre: string): LucideIconData | undefined {
    return this.icons.get(nombre);
  }
}