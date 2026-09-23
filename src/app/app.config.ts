import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { BASE_PATH } from './api';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { appCacheInterceptor } from './core/interceptors/app-cache.interceptor';
import { QuickPreloadStrategy } from './core/strategies/quick-preload.strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withPreloading(QuickPreloadStrategy)
    ),
    QuickPreloadStrategy,
    provideHttpClient(withInterceptors([jwtInterceptor, appCacheInterceptor])),
    // Configura la URL base del backend para los servicios de src/app/api
    { provide: BASE_PATH, useValue: 'http://localhost:3000' }
  ]
};