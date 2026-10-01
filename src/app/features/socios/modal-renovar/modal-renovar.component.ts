import { Component, input, output, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';
import { FormsModule } from '@angular/forms';
import { MembresiaResponseDto, PlanMembresiaResponseDto, RenovarMembresiaDto } from '@api';
import { MembresiasService } from '@api';
import { ToastService } from '@core/services/toast.service';
import { IconRegistry } from '../icon-registry.service';

@Component({
  selector: 'app-modal-renovar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" (click)="onBackdrop($event)">
        <div class="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-5 border-b border-outline-variant">
            <div>
              <h2 class="text-headline-md font-bold text-on-surface">Renovar membresía</h2>
              <p class="text-label-sm text-on-surface-variant mt-0.5">
                {{ membresia()?.planNombre }} · {{ tipoPlan() }}
              </p>
            </div>
            <button (click)="cerrar.emit()" class="p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors">
              <lucide-icon [img]="icon('x')" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <div class="p-5 space-y-5">
            <div class="bg-surface rounded-lg border border-outline-variant p-4 space-y-3">
              <h3 class="text-label-md font-medium text-on-surface-variant">Membresía actual</h3>
              <div class="grid grid-cols-2 gap-2 text-label-sm">
                <div><span class="text-on-surface-variant">Plan:</span> <span class="font-medium">{{ membresia()?.planNombre }}</span></div>
                <div><span class="text-on-surface-variant">Tipo:</span> <span class="font-medium">{{ tipoPlan() }}</span></div>
                <div><span class="text-on-surface-variant">Inicio:</span> <span class="font-medium">{{ membresia()?.fechaInicio | date:'dd/MM/yyyy':'UTC' }}</span></div>
                <div><span class="text-on-surface-variant">Fin:</span> <span class="font-medium" [class.text-warning]="estadoCalc() === 'vencida'">{{ membresia()?.fechaFin | date:'dd/MM/yyyy':'UTC' }}</span></div>
                <div class="sm:col-span-2">
                  <span class="text-on-surface-variant">Estado: </span>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm border whitespace-nowrap"
                        [class]="'border-' + estadoCalc()">
                    <lucide-icon [img]="icon(iconoCalc())" class="w-3.5 h-3.5"></lucide-icon>
                    {{ etiquetaCalc() }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-success-container/10 border border-success/30 rounded-lg p-4 space-y-3">
              <div class="flex items-center gap-2 text-success">
                <lucide-icon [img]="icon('check-circle')" class="w-5 h-5 flex-shrink-0"></lucide-icon>
                <p class="text-body-sm">
                  La membresía actual se marcará como <strong>vencida</strong> y se creará una nueva activa.
                </p>
              </div>
              <div>
                <label class="block text-label-sm font-medium text-on-surface-variant mb-1.5">Plan para la nueva membresía</label>
                <select [(ngModel)]="planSel" class="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  @for (p of planesActivos(); track p.id) {
                    <option [value]="p.id">{{ p.tipoMembresiaNombre }} · {{ p.tipoMembresiaNombre }} ({{ p.diasPorSemana }} d/s, {{ p.duracionDias }} días, $ {{ p.precio | number:'1.2-2' }})</option>
                  }
                  </select>
                  @if (planSel() && planSel() !== membresia()?.planId) {
                    <p class="text-label-sm text-primary flex items-center gap-1">
                      <lucide-icon [img]="icon('shield')" class="w-3.5 h-3.5"></lucide-icon>
                      Cambio de plan: la nueva membresía usará el plan seleccionado.
                    </p>
                  }
                </div>
              </div>

            <div class="flex justify-end gap-3 pt-2 border-t border-outline-variant">
              <button type="button" (click)="cerrar.emit()" class="px-5 py-2.5 text-label-md font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container rounded-lg transition-colors">
                Cancelar
              </button>
              <button type="button" (click)="confirmar()" [disabled]="guardando()" class="micro-btn px-5 py-2.5 text-label-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <lucide-icon [img]="icon('loader2')" class="w-4 h-4 animate-spin" *ngIf="guardando()"></lucide-icon>
                <lucide-icon [img]="icon('rotate-ccw')" class="w-4 h-4" *ngIf="!guardando()"></lucide-icon>
                {{ guardando() ? 'Renovando...' : 'Confirmar renovación' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalRenovarComponent {
  private readonly icons = inject(IconRegistry);
  private readonly membresiasService = inject(MembresiasService);
  private readonly toast = inject(ToastService);

  open = input.required<boolean>();
  membresia = input.required<MembresiaResponseDto | null>();
  planes = input.required<PlanMembresiaResponseDto[]>();

  cerrar = output<void>();
  renovado = output<void>();

  guardando = signal(false);
  planSel = signal<string>('');

  planesActivos = computed(() => this.planes().filter(p => p.activo));

  tipoPlan = computed(() => {
    const m = this.membresia();
    if (!m) return '—';
    const p = this.planes().find(x => x.id === m.planId);
    return p?.tipoMembresiaNombre || '—';
  });

  estadoCalc = computed(() => {
    const m = this.membresia();
    if (!m) return 'sin_membresia';
    if (m.estado !== 'activa' || !m.fechaFin) return m.estado;
    const hoy = new Date();
    const hoyLocal = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return new Date(m.fechaFin).getTime() < hoyLocal ? 'vencida' : 'activa';
  });

  etiquetaCalc = computed(() => {
    const e = this.estadoCalc();
    return e === 'activa' ? 'Activa' : e === 'vencida' ? 'Vencida' : e === 'suspendida' ? 'Suspendida' : e === 'cancelada' ? 'Cancelada' : 'Sin membresía';
  });

  iconoCalc = computed(() => {
    const e = this.estadoCalc();
    if (e === 'activa') return 'check-circle';
    if (e === 'vencida') return 'calendar-clock';
    if (e === 'suspendida') return 'pause-circle';
    return 'ban';
  });

  onBackdrop(e: MouseEvent) { if (e.target === e.currentTarget) this.cerrar.emit(); }

  icon(nombre: string): LucideIconData | undefined {
    return this.icons.get(nombre);
  }

  confirmar() {
    const m = this.membresia();
    if (!m || this.guardando()) return;

    const planId = this.planSel() || m.planId;
    this.guardando.set(true);

    const dto: RenovarMembresiaDto = planId !== m.planId ? { planId } : {};
    this.membresiasService.membresiasControllerRenovar(m.id, dto).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.success('Membresía renovada correctamente', { title: 'Renovada' });
        this.renovado.emit();
        this.cerrar.emit();
      },
      error: (err) => {
        this.guardando.set(false);
        this.toast.error(err.error?.message || 'Error al renovar la membresía', { title: 'Error' });
      },
    });
  }
}