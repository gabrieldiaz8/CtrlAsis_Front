import { Component, inject, signal } from '@angular/core';
import { LucideAngularModule, Users, DollarSign, Activity, AlertTriangle, TrendingUp, Minus } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { MetricasService } from '@api';
import { MetricasResumenDto } from '@api';
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
  readonly Minus = Minus;

  metricas = signal<MetricasResumenDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor() {
    this.layout.setPageTitle('Métricas Generales');
    this.loadMetricas();
  }

  loadMetricas() {
    this.loading.set(true);
    this.metricasService.metricasControllerGetResumen().subscribe({
      next: (data) => {
        this.metricas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar métricas');
        this.loading.set(false);
        console.error(err);
      }
    });
  }
}