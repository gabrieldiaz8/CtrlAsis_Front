import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

/**
 * Curvas de easing del sistema de diseño.
 * Entradas con ease-out (desaceleran) y salidas con ease-in (aceleran).
 */
export const EASE_OUT = 'cubic-bezier(0.25, 0.1, 0.25, 1)';
export const EASE_IN = 'cubic-bezier(0.4, 0, 1, 1)';

/** Fade de la página al cambiar de ruta (500ms, ease-out). */
export const routeFade = trigger('routeFade', [
  transition('* => *', [
    query(
      ':leave',
      [
        style({ position: 'absolute', top: 0, left: 0, width: '100%' }),
        animate('180ms ease-in', style({ opacity: 0 }))
      ],
      { optional: true }
    ),
    query(
      ':enter',
      [style({ opacity: 0 }), animate('500ms ease-out', style({ opacity: 1 }))],
      { optional: true }
    )
  ])
]);

/** Backdrop de modales: fundido de entrada/salida (200ms / 160ms). */
export const modalOverlay = trigger('modalOverlay', [
  transition(':enter', [style({ opacity: 0 }), animate('200ms ease-out', style({ opacity: 1 }))]),
  transition(':leave', [animate('160ms ease-in', style({ opacity: 0 }))])
]);

/**
 * Panel de modales: slide-up desde abajo + scale suave (300ms ease-out).
 * Funciona como slide-up en móvil y fade+scale en desktop. La salida es
 * una versión invertida con ease-in (180ms).
 */
export const modalPanel = trigger('modalPanel', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(28px) scale(0.96)' }),
    animate('300ms cubic-bezier(0.2, 0.9, 0.3, 1)', style({ opacity: 1, transform: 'none' }))
  ]),
  transition(':leave', [
    animate('180ms cubic-bezier(0.4, 0, 1, 1)', style({ opacity: 0, transform: 'translateY(16px) scale(0.97)' }))
  ])
]);

/**
 * Cascada para grids de cards y filas de tablas: cada elemento nuevo
 * entra con fade+slide y un delay incremental de 45ms (~320ms cada uno).
 * Se usa enlazado al array/estado (`[@staggerGrid]="items"`).
 */
export const staggerGrid = trigger('staggerGrid', [
  transition('* => *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateY(14px)' }),
        stagger(45, animate('320ms ease-out', style({ opacity: 1, transform: 'none' })))
      ],
      { optional: true }
    )
  ])
]);

/** Crossfade suave del contenido al cambiar de pestaña (250ms). */
export const crossfade = trigger('crossfade', [
  transition('* => *', [style({ opacity: 0 }), animate('250ms ease-out', style({ opacity: 1 }))])
]);

/** Fundido + zoom sutil para paneles que aparecen (resultados de acceso, dropdowns). */
export const fadeZoom = trigger('fadeZoom', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.97)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'none' }))
  ])
]);