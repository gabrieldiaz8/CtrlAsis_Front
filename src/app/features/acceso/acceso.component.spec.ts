import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AccesoComponent } from './acceso.component';
import { AccesosService } from '@api';
import { MainLayoutComponent } from '@shared/components/layout';
import { ToastService } from '@core/services/toast.service';

describe('AccesoComponent', () => {
  let component: AccesoComponent;
  let accesosServiceMock: {
    accesosControllerFindHoy: ReturnType<typeof vi.fn>;
    accesosControllerValidar: ReturnType<typeof vi.fn>;
    accesosControllerExcepcion: ReturnType<typeof vi.fn>;
  };
  let toastMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    accesosServiceMock = {
      accesosControllerFindHoy: vi.fn().mockReturnValue(of([])),
      accesosControllerValidar: vi.fn(),
      accesosControllerExcepcion: vi.fn()
    };
    toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    TestBed.configureTestingModule({
      imports: [AccesoComponent, NoopAnimationsModule],
      providers: [
        { provide: AccesosService, useValue: accesosServiceMock },
        { provide: MainLayoutComponent, useValue: { setPageTitle: vi.fn() } },
        { provide: ToastService, useValue: toastMock }
      ]
    });

    const fixture = TestBed.createComponent(AccesoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('registers the page title and loads today accesos on init', () => {
    expect(accesosServiceMock.accesosControllerFindHoy).toHaveBeenCalled();
  });

  it('does not validate when the DNI does not match the expected format', () => {
    component.checkinForm.patchValue({ dni: '12' });

    expect(component.checkinForm.invalid).toBe(true);
    component.onValidate();
    expect(accesosServiceMock.accesosControllerValidar).not.toHaveBeenCalled();
    expect(component.checkinForm.get('dni')?.touched).toBe(true);
  });

  it('accepts an 8-digit DNI and renders a "permitido" result', () => {
    accesosServiceMock.accesosControllerValidar.mockReturnValueOnce(
      of({
        id: '10',
        resultado: 'permitido',
        socioNombre: 'Juan Pérez',
        socioDni: '12345678',
        fechaHora: '2026-09-11T10:00:00',
        observacion: null
      })
    );

    component.checkinForm.patchValue({ dni: '12345678' });
    component.onValidate();

    expect(accesosServiceMock.accesosControllerValidar).toHaveBeenCalledWith({ dni: '12345678' });
    expect(component.loading()).toBe(false);
    expect(component.resultState()).toBe('permitido');
    expect(component.socio()).toEqual({ nombre: 'Juan', apellido: 'Pérez', dni: '12345678', observacion: '' });
    expect(component.ultimoAccesoId()).toBe('10');
    expect(toastMock.success).toHaveBeenCalledWith('Acceso permitido para Juan Pérez', { title: 'Validación OK' });
    expect(accesosServiceMock.accesosControllerFindHoy).toHaveBeenCalledTimes(2);
  });

  it('shows a toast error when the validation request fails', () => {
    accesosServiceMock.accesosControllerValidar.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Socio inexistente' } }))
    );

    component.checkinForm.patchValue({ dni: '99999999' });
    component.onValidate();

    expect(component.loading()).toBe(false);
    expect(toastMock.error).toHaveBeenCalledWith('Socio inexistente', { title: 'Error' });
    expect(component.resultState()).toBeNull();
  });

  it('shows a warning toast and a "excepcion" state when manual review is required', () => {
    accesosServiceMock.accesosControllerValidar.mockReturnValueOnce(
      of({
        id: '11',
        resultado: 'excepcion',
        socioNombre: 'María García',
        socioDni: '87654321',
        fechaHora: '2026-09-11T11:00:00',
        observacion: null
      })
    );

    component.checkinForm.patchValue({ dni: '87654321' });
    component.onValidate();

    expect(component.resultState()).toBe('excepcion');
    expect(toastMock.warning).toHaveBeenCalledWith(
      'Se requiere revisión y autorización para permitir el ingreso',
      { title: 'Revisión requerida' }
    );
  });
});