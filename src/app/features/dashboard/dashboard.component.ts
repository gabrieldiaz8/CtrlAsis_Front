import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { LucideAngularModule, Users, DollarSign, Activity, AlertTriangle, TrendingUp, TrendingDown, UserCheck, UserX, Wallet, BadgeCheck, X, Calendar, CalendarDays, RefreshCw } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { MetricasService, AccesosService, PagosService, MembresiasService } from '@api';
import { MetricasResumenDto, AsistenciaSemanalDto, IngresosMensualesDto, AccesoResponseDto } from '@api';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { RoleService } from '@core/services/role.service';
import { staggerGrid, crossfade, modalOverlay, modalPanel } from '@shared/utils/animations';

type Rango = 'hoy' | 'semana' | 'mes' | 'personalizado';

interface LinePoint {
  label: string;
  value: number;
  left: number;
  top: number;
  xLabel: string;
}

interface ActivityItem {
  id: string;
  tipo: 'acceso' | 'pago' | 'membresia';
  titulo: string;
  detalle: string;
  fecha: number;
  resultado?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  animations: [staggerGrid, crossfade, modalOverlay, modalPanel],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private metricasService = inject(MetricasService);
  private accesosService = inject(AccesosService);
  private pagosService = inject(PagosService);
  private membresiasService = inject(MembresiasService);
  private toast = inject(ToastService);
  private roleService = inject(RoleService);
  private router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly Users = Users;
  readonly DollarSign = DollarSign;
  readonly Activity = Activity;
  readonly AlertTriangle = AlertTriangle;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly UserCheck = UserCheck;
  readonly UserX = UserX;
  readonly Wallet = Wallet;
  readonly BadgeCheck = BadgeCheck;
  readonly X = X;
  readonly Calendar = Calendar;
  readonly CalendarDays = CalendarDays;
  readonly RefreshCw = RefreshCw;

  readonly rangoOptions: { value: Rango; label: string }[] = [
    { value: 'hoy', label: 'Hoy' },
    { value: 'semana', label: 'Esta semana' },
    { value: 'mes', label: 'Este mes' },
    { value: 'personalizado', label: 'Personalizado' }
  ];

  readonly canSeeIngresos = computed(() => this.roleService.hasAnyRole(['administrador', 'dueno', 'super_admin']));
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ============ Datos ============
  resumen = signal<MetricasResumenDto | null>(null);
  asistencia = signal<AsistenciaSemanalDto[]>([]);
  ingresosMensuales = signal<IngresosMensualesDto[]>([]);
  actividad = signal<ActivityItem[]>([]);

  resumenLoading = signal(true);
  asistenciaLoading = signal(true);
  ingresosLoading = signal(true);
  actividadLoading = signal(true);

  resumenError = signal(false);
  asistenciaError = signal(false);
  ingresosError = signal(false);
  actividadError = signal(false);

  // ============ KPIs con animación counter ============
  sociosCount = signal(0);
  ingresosCount = signal(0);
  asistenciaCount = signal(0);
  porVencerCount = signal(0);

  // ============ Rango de fechas ============
  rango = signal<Rango>('semana');
  customDesde = signal('');
  customHasta = signal('');

  readonly rangoLabel = computed(() => {
    switch (this.rango()) {
      case 'hoy': return 'Datos de hoy';
      case 'mes': return 'Datos de este mes';
      case 'personalizado':
        return this.customDesde() && this.customHasta()
          ? `Del ${this.formatDateLabel(this.customDesde())} al ${this.formatDateLabel(this.customHasta())}`
          : 'Rango personalizado';
      default: return 'Datos de esta semana';
    }
  });

  // ============ Drill-down asistencia ============
  selectedDay = signal<{ fecha: string; count: number; esHoy: boolean } | null>(null);
  dayAccesos = signal<AccesoResponseDto[]>([]);
  dayAccesosLoading = signal(false);
  dayAccesosError = signal(false);

  // ============ Tooltip del gráfico de línea ============
  hoverPoint = signal<number | null>(null);

  readonly Math = Math;

  // ============ Helpers de series ============
  get semanaMax() {
    const arr = this.asistencia();
    if (!arr.length) return 0;
    return Math.max(0, ...arr.map(d => d.accesosPermitidos ?? 0));
  }

  readonly ingresos6 = computed(() => this.ingresosMensuales().slice(-6));

  get ingresosMax() {
    const arr = this.ingresos6();
    return Math.max(1, ...arr.map(d => d.total ?? 0));
  }

  get ingresosEsteMes() {
    const arr = this.ingresosMensuales();
    return arr.length ? arr[arr.length - 1].total ?? 0 : 0;
  }

  get ingresosMesAnterior() {
    const arr = this.ingresosMensuales();
    return arr.length >= 2 ? arr[arr.length - 2].total ?? 0 : 0;
  }

  get cambioIngresos(): number | null {
    const anterior = this.ingresosMesAnterior;
    const actual = this.ingresosEsteMes;
    if (anterior <= 0) return null;
    return ((actual - anterior) / anterior) * 100;
  }

  get yAxisTicks() {
    return this.buildTicks(this.semanaMax);
  }

  get lineYAxisTicks() {
    return this.buildTicks(this.ingresosMax);
  }

  readonly linePoints = computed<LinePoint[]>(() => {
    const arr = this.ingresos6();
    if (!arr.length) return [];
    const max = this.ingresosMax;
    const step = 100 / (arr.length - 1 || 1);
    return arr.map((d, i) => ({
      label: this.getMonthLabel(d.mes),
      value: d.total ?? 0,
      left: Math.round(i * step * 100) / 100,
      top: Math.round((100 - ((d.total ?? 0) / max) * 100) * 100) / 100,
      xLabel: d.mes
    }));
  });

  readonly linePath = computed(() => {
    const pts = this.linePoints();
    if (pts.length < 2) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.left},${p.top}`).join(' ');
  });

  readonly lineAreaPath = computed(() => {
    const pts = this.linePoints();
    if (pts.length < 2) return '';
    const line = this.linePath();
    const first = pts[0];
    const last = pts[pts.length - 1];
    return `${line} L${last.left},100 L${first.left},100 Z`;
  });

  readonly asistenciaSparkline = computed(() => {
    return this.sparklinePath(this.asistencia().map(d => d.accesosPermitidos ?? 0));
  });

  readonly ingresosSparkline = computed(() => {
    return this.sparklinePath(this.ingresos6().map(d => d.total ?? 0));
  });

  barHeightPct(valor: number): number {
    const max = this.semanaMax;
    if (!max) return 0;
    return Math.max(0, Math.round((valor / max) * 100));
  }

  getDayLabel(fecha: string): string {
    const date = new Date(`${fecha}T12:00:00`);
    const label = date.toLocaleDateString('es-ES', { weekday: 'short' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  getFullDayLabel(fecha: string): string {
    const date = new Date(`${fecha}T12:00:00`);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  getMonthLabel(mes: string): string {
    const [y, m] = mes.split('-');
    if (!y || !m) return mes;
    const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${names[Number(m) - 1] ?? mes}`;
  }

  formatMoney(v: number): string {
    return v.toLocaleString('es-AR');
  }

  formatTick(v: number): string {
    return Number.isInteger(v) ? `${v}` : v.toFixed(1);
  }

  ngOnInit() {
    this.layout.setPageTitle('Métricas Generales');
    this.loadAll();
  }

  // ============ Carga en paralelo por sección ============
  private rangoParams(r: Rango = this.rango()): { desde?: string; hasta?: string } {
    const today = new Date();
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hasta = fmt(today);

    switch (r) {
      case 'hoy':
        return { desde: hasta, hasta };
      case 'mes': {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        return { desde: fmt(d), hasta };
      }
      case 'personalizado': {
        if (this.customDesde() && this.customHasta()) {
          return { desde: this.customDesde(), hasta: this.customHasta() };
        }
        return {};
      }
      default: {
        const day = (today.getDay() + 6) % 7;
        const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
        return { desde: fmt(monday), hasta };
      }
    }
  }

  setRango(r: Rango) {
    this.rango.set(r);
    this.loadMetricas();
    this.loadActividad();
  }

  onCustomDesdeChange(e: Event) {
    this.customDesde.set((e.target as HTMLInputElement).value);
  }

  onCustomHastaChange(e: Event) {
    this.customHasta.set((e.target as HTMLInputElement).value);
  }

  applyCustomRange() {
    if (!this.customDesde() || !this.customHasta()) {
      this.toast.warning('Seleccioná ambas fechas del rango personalizado', { title: 'Rango' });
      return;
    }
    if (this.customDesde() > this.customHasta()) {
      this.toast.warning('La fecha desde debe ser anterior a la hasta', { title: 'Rango' });
      return;
    }
    this.rango.set('personalizado');
    this.loadMetricas();
    this.loadActividad();
  }

  loadAll() {
    this.loadMetricas();
    this.loadActividad();
  }

  loadMetricas() {
    const { desde, hasta } = this.rangoParams();

    this.resumenLoading.set(true);
    this.resumenError.set(false);
    this.metricasService.metricasControllerGetResumen(desde, hasta).subscribe({
      next: (r) => {
        this.resumen.set(r);
        this.animateCounter(r.sociosActivos ?? 0, v => this.sociosCount.set(v));
        this.animateCounter(r.ingresosMesActual ?? 0, v => this.ingresosCount.set(v));
        this.animateCounter(r.asistenciaSemanaActual ?? 0, v => this.asistenciaCount.set(v));
        this.animateCounter(r.membresiasPorVencer ?? 0, v => this.porVencerCount.set(v));
        this.resumenLoading.set(false);
      },
      error: (err) => {
        this.resumenLoading.set(false);
        this.resumenError.set(true);
        console.error('Error loading resumen:', err);
      }
    });

    this.asistenciaLoading.set(true);
    this.asistenciaError.set(false);
    this.metricasService.metricasControllerGetAsistenciaSemanal(desde, hasta).subscribe({
      next: (a) => {
        this.asistencia.set((a as AsistenciaSemanalDto[]) || []);
        this.asistenciaLoading.set(false);
      },
      error: (err) => {
        this.asistenciaLoading.set(false);
        this.asistenciaError.set(true);
        console.error('Error loading asistencia:', err);
      }
    });

    this.ingresosLoading.set(true);
    this.ingresosError.set(false);
    this.metricasService.metricasControllerGetIngresosMensuales(desde, hasta).subscribe({
      next: (i) => {
        this.ingresosMensuales.set((i as IngresosMensualesDto[]) || []);
        this.ingresosLoading.set(false);
      },
      error: (err) => {
        this.ingresosLoading.set(false);
        this.ingresosError.set(true);
        console.error('Error loading ingresos:', err);
      }
    });
  }

  loadActividad() {
    this.actividadLoading.set(true);
    this.actividadError.set(false);

    const accesos$ = this.accesosService.accesosControllerFindHoy();
    const pagos$ = this.pagosService.pagosControllerFindAll(undefined, undefined, 8, 0);
    const membresias$ = this.membresiasService.membresiasControllerFindAll(undefined, undefined, 8, 0);

    let remaining = 3;
    let failed = false;
    const items: ActivityItem[] = [];

    const done = () => {
      remaining--;
      if (remaining === 0) {
        this.actividadLoading.set(false);
        if (failed) this.actividadError.set(true);
        const sorted = items.sort((a, b) => b.fecha - a.fecha).slice(0, 10);
        this.actividad.set(sorted);
      }
    };

    accesos$.subscribe({
      next: (data) => {
        const list = (data as AccesoResponseDto[]) || [];
        for (const a of list) {
          items.push({
            id: `acc-${a.id}`,
            tipo: 'acceso',
            titulo: a.socioNombre ? `Acceso de ${a.socioNombre}` : 'Acceso registrado',
            detalle: `${this.formatHora(a.fechaHora)} · ${this.resultadoLabel(a.resultado)}`,
            fecha: new Date(a.fechaHora).getTime(),
            resultado: a.resultado
          });
        }
        done();
      },
      error: () => { failed = true; done(); }
    });

    pagos$.subscribe({
      next: (data) => {
        const list = this.extractList(data);
        for (const p of list.slice(0, 8)) {
          items.push({
            id: `pag-${p.id}`,
            tipo: 'pago',
            titulo: `Pago de ${p.socioNombre}`,
            detalle: `$${Number(p.monto ?? 0).toLocaleString('es-AR')} · ${p.medioPagoNombre || 'pago'}`,
            fecha: new Date(p.fechaPago || p.fechaCreacion).getTime()
          });
        }
        done();
      },
      error: () => { failed = true; done(); }
    });

    membresias$.subscribe({
      next: (data) => {
        const list = this.extractList(data);
        for (const m of list.slice(0, 8)) {
          items.push({
            id: `mem-${m.id}`,
            tipo: 'membresia',
            titulo: `Membresía ${m.planNombre}`,
            detalle: `Creada para ${m.socioNombre}`,
            fecha: new Date(m.fechaCreacion).getTime()
          });
        }
        done();
      },
      error: () => { failed = true; done(); }
    });
  }

  private extractList(resp: any): any[] {
    return Array.isArray(resp) ? resp : (resp?.content || resp?.data || resp || []);
  }

  // ============ Drill-down ============
  onBarClick(item: AsistenciaSemanalDto | { fecha: string; count: number; esHoy: boolean }) {
    const esHoy = 'esHoy' in item ? item.esHoy : this.isToday(item.fecha);
    const count = 'count' in item ? item.count : item.accesosPermitidos;
    this.selectedDay.set({ fecha: item.fecha, count, esHoy });
    this.dayAccesos.set([]);
    this.dayAccesosError.set(false);

    if (esHoy) {
      this.dayAccesosLoading.set(true);
      this.accesosService.accesosControllerFindHoy().subscribe({
        next: (data) => {
          const list = (data as AccesoResponseDto[]) || [];
          const dia = list.filter(a => a.fechaHora?.startsWith(item.fecha));
          this.dayAccesos.set(dia.length ? dia : list);
          this.dayAccesosLoading.set(false);
        },
        error: () => {
          this.dayAccesosLoading.set(false);
          this.dayAccesosError.set(true);
        }
      });
    } else {
      this.dayAccesosLoading.set(false);
    }
  }

  closeDayModal() {
    this.selectedDay.set(null);
    this.dayAccesos.set([]);
  }

  openAcceso() {
    this.closeDayModal();
    this.router.navigate(['/acceso']);
  }

  private isToday(fecha: string): boolean {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return fecha === today;
  }

  formatHora(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  resultadoLabel(r?: string): string {
    switch (r) {
      case 'permitido': return 'Permitido';
      case 'rechazado': return 'Rechazado';
      case 'excepcion': return 'Excepción';
      default: return '';
    }
  }

  // ============ Animación counter ============
  private animateCounter(target: number, set: (v: number) => void) {
    if (!this.isBrowser) {
      set(target);
      return;
    }
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

  // ============ SVG helpers ============
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

  private buildTicks(max: number): number[] {
    const nice = this.niceCeil(max);
    if (nice <= 0) return [0, 0, 0, 0, 0];
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

  private formatDateLabel(iso: string): string {
    const d = new Date(`${iso}T12:00:00`);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  // ============ Actividad ============
  timeAgo(fechaMs: number): string {
    const diff = Date.now() - fechaMs;
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'hace un momento';
    if (min < 60) return min === 1 ? 'hace 1 min' : `hace ${min} min`;
    const horas = Math.floor(min / 60);
    if (horas < 24) return horas === 1 ? 'hace 1 hora' : `hace ${horas} horas`;
    const dias = Math.floor(horas / 24);
    if (dias === 1) return 'ayer';
    return `hace ${dias} días`;
  }
}