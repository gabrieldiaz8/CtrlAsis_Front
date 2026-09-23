import { HttpContextToken, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Observable, of, tap } from 'rxjs';

/** Permite desactivar el caché para una petición puntual: request.context.set(SKIP_CACHE, true) */
export const SKIP_CACHE = new HttpContextToken<boolean>(() => false);

/** TTL por defecto para respuestas GET cacheadas. */
export const APP_CACHE_TTL = 10_000;

/** Recursos dinámicos que nunca deben cachearse. */
const NEVER_CACHE_PATTERNS: RegExp[] = [
  /\/metricas\//,
  /\/accesos\//,
  /\/auth\//,
  /\/login/,
];

/** Límite máximo de entradas en caché (simple LRU aproximada). */
export const APP_CACHE_MAX_ENTRIES = 150;

/** Limpia la caché completa (se usa al cambiar de token/usuario o ante 401). */
export function appCacheClear(): void {
  cache.clear();
}

interface CacheEntry {
  response: HttpResponse<unknown>;
  storedAt: number;
}

const cache = new Map<string, CacheEntry>();

function resourceRoot(pathname: string): string {
  const first = pathname.split('/').filter(Boolean)[0];
  return first ? `/${first}` : pathname;
}

function shouldSkip(urlWithParams: string): boolean {
  return NEVER_CACHE_PATTERNS.some((re) => re.test(urlWithParams));
}

function bustFor(method: string, urlWithParams: string): void {
  if (method === 'GET') return;
  if (cache.size === 0) return;

  let root: string;
  try {
    root = resourceRoot(new URL(urlWithParams).pathname);
  } catch {
    return;
  }

  for (const [key, entry] of cache) {
    let keyPath: string;
    try {
      keyPath = new URL(key).pathname;
    } catch {
      cache.delete(key);
      continue;
    }
    if (keyPath === root || keyPath.startsWith(`${root}/`)) {
      cache.delete(key);
    }
  }
}

export function appCacheInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  const { method, urlWithParams } = req;

  // En SSR el Map es compartido entre requests del servidor: no cachear para
  // evitar filtrar datos entre usuarios.
  if (isPlatformServer(inject(PLATFORM_ID))) {
    return next(req);
  }

  if (method !== 'GET' || req.context.get(SKIP_CACHE) || shouldSkip(urlWithParams)) {
    bustFor(method, urlWithParams);
    return next(req);
  }

  const hit = cache.get(urlWithParams);
  if (hit && Date.now() - hit.storedAt < APP_CACHE_TTL) {
    return of(hit.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.ok) {
        if (cache.size >= APP_CACHE_MAX_ENTRIES) {
          const oldest = cache.keys().next();
          if (!oldest.done) cache.delete(oldest.value);
        }
        cache.set(urlWithParams, {
          response: event.clone(),
          storedAt: Date.now(),
        });
      }
    })
  );
}