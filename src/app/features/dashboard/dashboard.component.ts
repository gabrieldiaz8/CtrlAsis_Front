import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { LucideAngularModule, Users, DollarSign, Activity, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { MetricasService } from '@api';
import { MetricasResumenDto, AsistenciaSemanalDto, IngresosMensualesDto } from '@api';
import { CommonModule, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, DecimalPipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  private layout = inject(MainLayoutComponent);
  private metricasService = inject(MetricasService);

  readonly Users = Users;
  readonly DollarSign = DollarSign;
  readonly Activity = Activity;
  readonly AlertTriangle = AlertTriangle;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Minus = Minus;

  metricas = signal<MetricasResumenDto | null>(null);
  asistenciaSemanal = signal<AsistenciaSemanalDto[]>([]);
  ingresosMensuales = signal<IngresosMensualesDto[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  get semanaMax() {
    const arr = this.asistenciaSemanal();
    if (!arr.length) return 0;
    return Math.max(0, ...arr.map(d => d.accesosPermitidos ?? 0));
  }

  get ingresosEsteMes() {
    const arr = this.ingresosMensuales();
    return arr.length ? arr[arr.length - 1].total ?? 0 : 0;
  }

  get ingresosMesAnterior() {
    const arr = this.ingresosMensuales();
    return arr.length >= 2 ? arr[arr.length - 2].total ?? 0 : undefined;
  }

  get ingresosMax() {
    const actual = this.ingresosEsteMes;
    const anterior = this.ingresosMesAnterior ?? 0;
    return Math.max(actual, anterior);
  }

  get cambioIngresos() {
    const arr = this.ingresosMensuales();
    if (arr.length < 2) return null;
    const anterior = arr[arr.length - 2].total ?? 0;
    const actual = arr[arr.length - 1].total ?? 0;
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  }

  barHeightPct(valor: number): number {
    const max = this.semanaMax;
    if (!max) return 0;
    return Math.max(0, Math.round((valor / max) * 100));
  }

  ingresosWidthPct(valor: number): number {
    const max = this.ingresosMax;
    if (!max) return 0;
    return Math.max(0, Math.round((valor / max) * 100));
  }

  getDayLabel(fecha: string): string {
    const date = new Date(`${fecha}T12:00:00`);
    const label = date.toLocaleDateString('es-ES', { weekday: 'short' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  get yAxisTicks() {
    return this.buildTicks(this.semanaMax);
  }

  private buildTicks(max: number): number[] {
    const nice = this.niceCeil(max);
    return [nice, Math.round(nice * 0.75), Math.round(nice * 0.5), Math.round(nice * 0.25), 0];
  }

  private niceCeil(n: number): number {
    if (n <= 0) return 0;
    const pow = Math.pow(10, Math.floor(Math.log10(n)));
    const d = n / pow;
    if (d <= 1) return pow;
    if (d <= 2) return 2 * pow;
    if (d <= 5) return 5 * pow;
    return 10 * pow;
  }

  formatTick(v: number): string {
    return Number.isInteger(v) ? `${v}` : v.toFixed(1);
  }

  loadMetricas() {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      resumen: this.metricasService.metricasControllerGetResumen(),
      asistencia: this.metricasService.metricasControllerGetAsistenciaSemanal(),
      ingresos: this.metricasService.metricasControllerGetIngresosMensuales(),
    }).subscribe({
      next: ({ resumen, asistencia, ingresos }) => {
        this.metricas.set(resumen);
        this.asistenciaSemanal.set(asistencia);
        this.ingresosMensuales.set(ingresos);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar métricas');
        this.loading.set(false);
        console.error(err);
      }
    });
  }

  constructor() {
    this.layout.setPageTitle('Métricas Generales');
    this.loadMetricas();
  }
}