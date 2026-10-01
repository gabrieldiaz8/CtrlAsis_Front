import { Injectable } from '@angular/core';

export type EstadoCalculadoMembresia =
  | 'activa'
  | 'vencida'
  | 'suspendida'
  | 'cancelada'
  | 'sin_membresia';

@Injectable({ providedIn: 'root' })
export class MembresiaEstadoHelper {
  /**
   * Calcula el estado efectivo de una membresía para la UI.
   * Regla: si el backend dice 'activa' pero la fecha de fin ya pasó, es 'vencida'.
   * Coincide con el filtro `estadoMembresia` del backend.
   */
  calcular(
    resumen: { estado: string; fechaFin?: string | Date | null } | null | undefined,
  ): EstadoCalculadoMembresia {
    if (!resumen) return 'sin_membresia';
    if (resumen.estado !== 'activa' || !resumen.fechaFin) return resumen.estado as EstadoCalculadoMembresia;
    const hoy = new Date();
    const hoyLocal = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    return new Date(resumen.fechaFin).getTime() < hoyLocal ? 'vencida' : 'activa';
  }

  etiqueta(estado: EstadoCalculadoMembresia): string {
    switch (estado) {
      case 'activa': return 'Activa';
      case 'vencida': return 'Vencida';
      case 'suspendida': return 'Suspendida';
      case 'cancelada': return 'Cancelada';
      case 'sin_membresia': return 'Sin membresía';
    }
  }

  clasesBadge(estado: EstadoCalculadoMembresia): string {
    switch (estado) {
      case 'activa': return 'bg-success-container text-on-success-container border-success';
      case 'vencida': return 'bg-warning-container text-on-warning-container border-warning';
      case 'suspendida': return 'bg-primary-container text-on-primary-container border-primary';
      case 'cancelada': return 'bg-error-container text-on-error-container border-error';
      case 'sin_membresia': return 'bg-surface-container-highest text-on-surface-variant border-outline-variant';
    }
  }

  /** Devuelve el nombre del icono (clave del IconRegistry), no el icono en sí. */
  iconoNombre(estado: EstadoCalculadoMembresia): string {
    switch (estado) {
      case 'activa': return 'check-circle';
      case 'vencida': return 'calendar-clock';
      case 'suspendida': return 'pause-circle';
      case 'cancelada': return 'ban';
      case 'sin_membresia': return 'circle-slash';
    }
  }
}