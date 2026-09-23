import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts credentials to /auth/login and returns the login response', () => {
    let result: unknown;
    const body = { email: 'admin@ctrl.com', password: 'secret123' };

    service.authControllerLogin(body).subscribe((r) => (result = r));

    const req = httpMock.expectOne('http://localhost/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    expect(req.request.headers.get('Accept')).toBe('application/json');

    req.flush({ accessToken: 'jwt-token', user: { id: '1', rol: 'dueno' } });

    expect(result).toEqual({
      accessToken: 'jwt-token',
      user: { id: '1', rol: 'dueno' }
    });
  });
});