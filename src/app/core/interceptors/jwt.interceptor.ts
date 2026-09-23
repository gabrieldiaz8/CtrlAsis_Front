import { HttpInterceptorFn } from '@angular/common/http';
import { appCacheClear } from './app-cache.interceptor';

let lastToken: string | null = null;

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token'); // LoginComponent guarda el token aquí

  // Si cambió la sesión (login/switch de usuario), descarta el caché HTTP para
  // no filtrar datos de una sesión anterior.
  if (token !== lastToken) {
    lastToken = token;
    appCacheClear();
  }

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};