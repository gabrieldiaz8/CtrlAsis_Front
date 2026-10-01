import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideAngularModule, Users, DollarSign, Activity, AlertTriangle, TrendingUp, TrendingDown, Calendar, RefreshCw, Clock } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { AccesoResponseDto, MetricasService, MembresiasService, AccesosService } from '@api';
import { MetricasResumenDto, AsistenciaSemanalDto, IngresosMensualesDto } from '@api';
import { CommonModule } from '@angular/common';
import { RoleService } from '@core/services/role.service';
import { staggerGrid, crossfade } from '@shared/utils/animations';
import { AccesosHoyComponent } from './accesos-hoy.component';

interface LinePoint {
  label: string;
  value: number;
  left: number;
  top: number;
  xLabel: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule, AccesosHoyComponent],
  schemas: [NO_ERRORS_SCHEMA],
  animations: [staggerGrid, crossfade],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private metricasService = inject(MetricasService);
  private membresiasService = inject(MembresiasService);
  private accesosService = inject(AccesosService);
  private roleService = inject(RoleService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly Users = Users;
  readonly DollarSign = DollarSign;
  readonly Activity = Activity;
  readonly AlertTriangle = AlertTriangle;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Calendar = Calendar;
  readonly RefreshCw = RefreshCw;
  readonly Clock = Clock;

  readonly canSeeIngresos = computed(() => this.roleService.hasAnyRole(['administrador', 'dueno', 'super_admin']));
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly Math = Math;

  // ============ Datos ============
  resumen = signal<MetricasResumenDto | null>(null);
  asistencia = signal<AsistenciaSemanalDto[]>([]);
  ingresosMensuales = signal<IngresosMensualesDto[]>([]);
  accesosHoy = signal<AccesoResponseDto[]>([]);

  resumenLoading = signal(true);
  asistenciaLoading = signal(true);
  ingresosLoading = signal(true);
  vencidasLoading = signal(true);
  accesosLoading = signal(true);

  resumenError = signal(false);
  asistenciaError = signal(false);
  ingresosError = signal(false);
  accesosError = signal<string | null>(null);

  // ============ KPIs ============
  sociosCount = signal(0);
  ingresosCount = signal(0);
  asistenciaCount = signal(0);
  vencidasCount = signal(0);
  accesosCount = signal(0);

  // ============ Ingresos comparativo (para badge) ============
  readonly ingresos6 = computed(() => this.ingresosMensuales().slice(-6));

  get ingresosEsteMes(): number {
    const arr = this.ingresosMensuales();
    return arr.length ? arr[arr.length - 1].total ?? 0 : 0;
  }

  get ingresosMesAnterior(): number {
    const arr = this.ingresosMensuales();
    return arr.length >= 2 ? arr[arr.length - 2].total ?? 0 : 0;
  }

  /** null = sin datos para comparar; positivo = sube; negativo = baja */
  get cambioIngresos(): number | null {
    const anterior = this.ingresosMesAnterior;
    const actual = this.ingresosEsteMes;
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  }

  // ============ Ciclo de vida ============
  ngOnInit() {
    this.layout.setPageTitle('Métricas Generales');
    this.loadAll();
  }

  loadAll() {
    this.loadMetricas();
    this.loadVencidas();
    this.loadAccesosHoy();
  }

  // ============ Carga de datos ============
  loadMetricas() {
    this.resumenLoading.set(true);
    this.resumenError.set(false);
    this.metricasService.metricasControllerGetResumen().subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.animateCounter(r.sociosActivos ?? 0, v => this.sociosCount.set(v));
        this.animateCounter(r.ingresosMesActual ?? 0, v => this.ingresosCount.set(v));
        this.animateCounter(r.asistenciaSemanaActual ?? 0, v => this.asistenciaCount.set(v));
        this.resumenLoading.set(false);
      },
      error: () => {
        this.resumenLoading.set(false);
        this.resumenError.set(true);
      }
    });

    this.asistenciaLoading.set(true);
    this.asistenciaError.set(false);
    this.metricasService.metricasControllerGetAsistenciaSemanal().subscribe({
      next: (a) => {
        this.asistencia.set((a as AsistenciaSemanalDto[]) || []);
        this.asistenciaLoading.set(false);
      },
      error: () => {
        this.asistenciaLoading.set(false);
        this.asistenciaError.set(true);
      }
    });

    this.ingresosLoading.set(true);
    this.ingresosError.set(false);
    this.metricasService.metricasControllerGetIngresosMensuales().subscribe({
      next: (i) => {
        this.ingresosMensuales.set((i as IngresosMensualesDto[]) || []);
        this.ingresosLoading.set(false);
      },
      error: () => {
        this.ingresosLoading.set(false);
        this.ingresosError.set(true);
      }
    });
  }

  /** Carga el total de membresías con estado 'vencida' desde el API */
  loadVencidas() {
    this.vencidasLoading.set(true);
    this.membresiasService.membresiasControllerFindAll(undefined, 'vencida', 1, 0).subscribe({
      next: (resp) => {
        const total = (resp as any)?.total ?? 0;
        this.animateCounter(total, v => this.vencidasCount.set(v));
        this.vencidasLoading.set(false);
      },
      error: () => {
        this.vencidasLoading.set(false);
      }
    });
  }

  /** Carga los accesos validados hoy desde el API */
  loadAccesosHoy() {
    this.accesosLoading.set(true);
    this.accesosError.set(null);
    this.accesosService.accesosControllerFindHoy().subscribe({
      next: (accesos) => {
        this.accesosHoy.set(accesos || []);
        this.accesosCount.set((accesos || []).length);
        this.accesosLoading.set(false);
      },
      error: (err) => {
        this.accesosError.set('No se pudieron cargar los accesos de hoy');
        this.accesosLoading.set(false);
        console.error('Error loading accesos de hoy:', err);
      }
    });
  }

  // ============ Animación counter ============
  private animateCounter(target: number, set: (v: number) => void) {
    if (!this.isBrowser) { set(target); return; }
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      set(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ============ Helpers de formato ============
  formatMoney(v: number): string {
    return v.toLocaleString('es-AR');
  }

  formatTick(v: number): string {
    return Number.isInteger(v) ? `${v}` : v.toFixed(1);
  }

  // ============ SVG sparkline helpers ============
  sparklinePath(values: number[]): string {
    if (values.length < 2) return '';
    const max = Math.max(...values, 1);
    const step = 100 / (values.length - 1);
    return values
      .map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)},${(100 - (v / max) * 100).toFixed(2)}`)
      .join(' ');
  }

  sparklineAreaPath(values: number[]): string {
    const line = this.sparklinePath(values);
    if (!line) return '';
    return `${line} L100,100 L0,100 Z`;
  }

  sparklineValues(source: 'asistencia' | 'ingresos'): number[] {
    if (source === 'asistencia') return this.asistencia().map(d => d.accesosPermitidos ?? 0);
    return this.ingresos6().map(d => d.total ?? 0);
  }

  sparklineEmpty(source: 'asistencia' | 'ingresos'): boolean {
    const vals = this.sparklineValues(source);
    return vals.length < 2 || vals.every(v => v === 0);
  }
}