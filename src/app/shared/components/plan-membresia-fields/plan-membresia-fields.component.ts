import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';
import { merge } from 'rxjs';
import { LucideAngularModule, Calendar } from 'lucide-angular';
import { PlanMembresiaResponseDto } from '@api';

/**
 * Calcula el vencimiento de una membresía sumando `duracion_dias` del plan a la
 * fecha de inicio. Se fija a las 12:00 para que el corrimiento de zona horaria
 * nunca mueva la fecha un día.
 */
export function calcularFechaFinMembresia(fechaInicio: string, duracionDias: number): string {
  const fin = new Date(fechaInicio);
  fin.setHours(12, 0, 0, 0);
  fin.setDate(fin.getDate() + duracionDias);
  return fin.toISOString().split('T')[0];
}

/**
 * Bloque de alta de membresía: plan + fecha de inicio + fecha de fin.
 *
 * Recibe el FormGroup del padre (controles `planId`, `fechaInicio`, `fechaFin`) y
 * escribe ahí la `fechaFin` calculada, de modo que el padre siempre pueda leer los
 * tres valores juntos con `getRawValue()`. La `fechaFin` es de solo lectura: se
 * mantiene deshabilitada y no es necesario que nadie la toque.
 *
 * Para bloquear la edición el padre deshabilita los controles `planId` y
 * `fechaInicio`; la `fechaFin` tiene que quedar deshabilitada siempre. No se usa el
 * atributo `disabled` sobre los inputs porque eso rompe los form controls reactivos.
 */
@Component({
  selector: 'app-plan-membresia-fields',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './plan-membresia-fields.component.html'
})
export class PlanMembresiaFieldsComponent {
  form = input.required<FormGroup>();
  planes = input.required<PlanMembresiaResponseDto[]>();

  readonly Calendar = Calendar;

  private readonly planIdActual = signal('');
  private readonly fechaInicioActual = signal('');

  readonly planSeleccionado = computed(() =>
    this.planes().find(p => p.id === this.planIdActual()) ?? null
  );

  private readonly fechaFinPreview = computed(() => {
    const plan = this.planSeleccionado();
    if (!plan) return null;
    return calcularFechaFinMembresia(this.fechaInicioActual(), plan.duracionDias);
  });

  constructor() {
    effect(onCleanup => {
      const form = this.form();
      const planControl = form.get('planId');
      const inicioControl = form.get('fechaInicio');
      if (!planControl || !inicioControl) return;

      const sincronizar = () => {
        this.planIdActual.set(planControl.value ?? '');
        this.fechaInicioActual.set(inicioControl.value ?? '');
      };
      sincronizar();

      const subscription = merge(planControl.valueChanges, inicioControl.valueChanges)
        .subscribe(sincronizar);
      onCleanup(() => subscription.unsubscribe());
    });

    effect(() => {
      const form = this.form();
      const fechaFin = this.fechaFinPreview() ?? '';
      if (form.get('fechaFin')?.value !== fechaFin) {
        form.patchValue({ fechaFin }, { emitEvent: false });
      }
    });
  }

  get planRequerido(): boolean {
    const control = this.form().get('planId');
    return !!control && control.invalid && (control.dirty || control.touched);
  }
}
