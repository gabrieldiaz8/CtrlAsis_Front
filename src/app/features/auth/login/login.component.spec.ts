import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '@api';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { RoleService } from '@core/services/role.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let authServiceMock: { authControllerLogin: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let toastMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn>; warning: ReturnType<typeof vi.fn> };
  let roleServiceMock: { refresh: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();

    authServiceMock = { authControllerLogin: vi.fn() };
    routerMock = { navigate: vi.fn().mockResolvedValue(true) };
    toastMock = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };
    roleServiceMock = { refresh: vi.fn() };

    TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastService, useValue: toastMock },
        { provide: RoleService, useValue: roleServiceMock }
      ]
    });

    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('stores the token, user data and remember_me on successful login', () => {
    authServiceMock.authControllerLogin.mockReturnValueOnce(
      of({ accessToken: 'jwt-token', user: { id: '1', rol: 'dueno', email: 'admin@ctrl.com' } })
    );

    component.loginForm.setValue({ email: 'admin@ctrl.com', password: 'secret123' });
    component.rememberMe.set(true);
    component.onSubmit();

    expect(authServiceMock.authControllerLogin).toHaveBeenCalledWith({
      email: 'admin@ctrl.com',
      password: 'secret123'
    });
    expect(localStorage.getItem('access_token')).toBe('jwt-token');
    expect(localStorage.getItem('user_data')).toBe(JSON.stringify({ id: '1', rol: 'dueno', email: 'admin@ctrl.com' }));
    expect(localStorage.getItem('remember_me')).toBe('true');
    expect(roleServiceMock.refresh).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBe(false);
  });

  it('removes remember_me when the checkbox is unchecked', () => {
    localStorage.setItem('remember_me', 'true');
    authServiceMock.authControllerLogin.mockReturnValueOnce(of({ accessToken: 'jwt-token', user: null }));

    component.loginForm.setValue({ email: 'admin@ctrl.com', password: 'secret123' });
    component.rememberMe.set(false);
    component.onSubmit();

    expect(localStorage.getItem('remember_me')).toBeNull();
    expect(localStorage.getItem('access_token')).toBe('jwt-token');
  });

  it('does not call the API and touches the form when invalid', () => {
    component.loginForm.setValue({ email: 'mal-formato', password: '123' });
    component.onSubmit();

    expect(authServiceMock.authControllerLogin).not.toHaveBeenCalled();
    expect(component.loginForm.touched).toBe(true);
  });

  it('shows a toast error and clears loading on failed login', () => {
    authServiceMock.authControllerLogin.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Credenciales inválidas' } }))
    );

    component.loginForm.setValue({ email: 'admin@ctrl.com', password: 'secret123' });
    component.onSubmit();

    expect(toastMock.error).toHaveBeenCalledWith('Credenciales inválidas', { title: 'Error de acceso' });
    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(component.loading()).toBe(false);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});