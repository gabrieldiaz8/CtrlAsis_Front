import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { MetricasService, AccesosService, PagosService, MembresiasService } from '@api';
import { MainLayoutComponent } from '@shared/components/layout';
import { ToastService } from '@core/services/toast.service';
import { RoleService } from '@core/services/role.service';

function configure(hasAnyRole: ReturnType<typeof vi.fn>) {
  const layoutMock = { setPageTitle: vi.fn() };
  const routerMock = { navigate: vi.fn() };
  const toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
  const roleMock = { hasAnyRole };

  const metricasMock = {
    metricasControllerGetResumen: vi.fn().mockReturnValue(
      of({ sociosActivos: 120, ingresosMesActual: 250000, asistenciaSemanaActual: 300, membresiasPorVencer: 8 })
    ),
    metricasControllerGetAsistenciaSemanal: vi.fn().mockReturnValue(
      of([
        { fecha: '2026-09-07', accesosPermitidos: 10 },
        { fecha: '2026-09-08', accesosPermitidos: 12 }
      ])
    ),
    metricasControllerGetIngresosMensuales: vi.fn().mockReturnValue(
      of([
        { mes: '2026-08', total: 200000 },
        { mes: '2026-09', total: 250000 }
      ])
    )
  };
  const accesosMock = {
    accesosControllerFindHoy: vi.fn().mockReturnValue(
      of([{ id: '1', socioNombre: 'Juan Pérez', resultado: 'permitido', fechaHora: '2026-09-11T09:00:00' }])
    )
  };
  const pagosMock = { pagosControllerFindAll: vi.fn().mockReturnValue(of([])) };
  const membresiasMock = { membresiasControllerFindAll: vi.fn().mockReturnValue(of([])) };

  TestBed.configureTestingModule({
    imports: [DashboardComponent, NoopAnimationsModule],
    providers: [
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: MainLayoutComponent, useValue: layoutMock },
      { provide: MetricasService, useValue: metricasMock },
      { provide: AccesosService, useValue: accesosMock },
      { provide: PagosService, useValue: pagosMock },
      { provide: MembresiasService, useValue: membresiasMock },
      { provide: ToastService, useValue: toastMock },
      { provide: RoleService, useValue: roleMock },
      { provide: Router, useValue: routerMock }
    ]
  });

  const fixture = TestBed.createComponent(DashboardComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance as DashboardComponent, metricasMock, accesosMock, toastMock };
}

describe('DashboardComponent', () => {
  it('sets the page title and loads all metric sections on init', () => {
    const { metricasMock, accesosMock } = configure(vi.fn().mockReturnValue(true));

    expect(metricasMock.metricasControllerGetResumen).toHaveBeenCalled();
    expect(metricasMock.metricasControllerGetAsistenciaSemanal).toHaveBeenCalled();
    expect(metricasMock.metricasControllerGetIngresosMensuales).toHaveBeenCalled();
    expect(accesosMock.accesosControllerFindHoy).toHaveBeenCalled();
  });

  it('renders KPIs when metrics resolve', () => {
    const allRoles = vi.fn().mockReturnValue(true);
    const { component, fixture } = configure(allRoles);

    expect(component.sociosCount()).toBe(120);
    expect(component.ingresosCount()).toBe(250000);
    expect(component.asistenciaCount()).toBe(300);
    expect(component.porVencerCount()).toBe(8);
    expect(component.resumenLoading()).toBe(false);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Socios activos');
    expect(text).toContain('120');
  });

  it('hides the ingresos card for roles that cannot see financial data', () => {
    const limited = vi.fn().mockReturnValue(false);
    const { fixture } = configure(limited);

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Socios activos');
    expect(text).not.toContain('Ingresos del mes');
  });

  it('shows the ingresos card for roles that can see financial data', () => {
    const allowed = vi.fn().mockReturnValue(true);
    const { fixture } = configure(allowed);

    expect(fixture.nativeElement.textContent).toContain('Ingresos del mes');
    expect(allowed).toHaveBeenCalledWith(['administrador', 'dueno', 'super_admin']);
  });
});