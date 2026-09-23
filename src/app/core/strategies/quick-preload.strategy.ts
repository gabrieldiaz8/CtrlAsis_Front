import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

/**
 * Precarga las rutas lazy que el usuario tiene alta probabilidad de visitar.
 *
 * En el primer render solo se carga la ruta activa; apenas el router queda
 * inactivo se precargan los módulos marcados con data.preload === true en
 * orden de prioridad (dashboard, acceso, socios…), dejando fuera los
 * paneles administrativos pesados (configuración, catálogos).
 */
@Injectable()
export class QuickPreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<any> {
    if (route.data?.['preload'] !== true) {
      return EMPTY;
    }
    const delay = route.data?.['preloadDelay'] ?? 0;
    return timer(delay).pipe(mergeMap(() => load()));
  }
}