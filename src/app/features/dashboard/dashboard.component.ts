import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit, PLATFORM_ID, NO_ERRORS_SCHEMA } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LucideAngularModule, Users, DollarSign, Activity, AlertTriangle, TrendingUp, TrendingDown, Calendar, RefreshCw } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { MetricasService, MetricasResumenDto } from '@api';
import { CommonModule } from '@angular/common';
import { RoleService } from '@core/services/role.service';
import { staggerGrid, crossfade } from '@shared/utils/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  animations: [staggerGrid, crossfade],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private metricasService = inject(MetricasService);
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

  readonly canSeeIngresos = computed(() => this.roleService.hasAnyRole(['administrador', 'dueno', 'super_admin']));
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // ============ Datos ============
  resumen = signal<MetricasResumenDto | null>(null);
  resumenLoading = signal(true);
  resumenError = signal(false);

  // ============ KPIs con animación counter ============
  sociosCount = signal(0);
  ingresosCount = signal(0);
  asistenciaCount = signal(0);
  porVencerCount = signal(0);

  readonly Math = Math;

  // Hack temporal porque la vista espera cambioIngresos. 
  // Podríamos calcularlo si el endpoint trae historial, por ahora fijo o nulo.
  get cambioIngresos(): number | null {
    return null;
  }

  ngOnInit() {
    this.layout.setPageTitle('Métricas Generales');
    this.loadAll();
  }

  loadAll() {
    this.loadMetricas();
  }

  loadMetricas() {
    this.resumenLoading.set(true);
    this.resumenError.set(false);
    this.metricasService.metricasControllerGetResumen().subscribe({
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


}