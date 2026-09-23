import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  duration?: number;
}

export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  leaving: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly MAX_VISIBLE = 3;
  private readonly DEFAULT_DURATION = 4000;
  private readonly LEAVE_MS = 200;

  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private nextId = 1;

  readonly success = (message: string, options: ToastOptions = {}): void => this.push('success', message, options);
  readonly error = (message: string, options: ToastOptions = {}): void => this.push('error', message, options);
  readonly warning = (message: string, options: ToastOptions = {}): void => this.push('warning', message, options);
  readonly info = (message: string, options: ToastOptions = {}): void => this.push('info', message, options);

  dismiss(id: number): void {
    this._toasts.update(list => list.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => this.remove(id), this.LEAVE_MS);
  }

  private push(type: ToastType, message: string, options: ToastOptions): void {
    const toast: Toast = {
      id: this.nextId++,
      type,
      title: options.title,
      message,
      duration: options.duration ?? this.DEFAULT_DURATION,
      leaving: false,
    };

    let evictedId: number | null = null;

    this._toasts.update(list => {
      const next = [toast, ...list];
      if (next.length <= this.MAX_VISIBLE) return next;

      const evicted = next[next.length - 1];
      evictedId = evicted.id;
      return next.slice(0, this.MAX_VISIBLE).map(t => (t.id === evicted.id ? { ...t, leaving: true } : t));
    });

    if (evictedId !== null) {
      const id = evictedId;
      setTimeout(() => this.remove(id), this.LEAVE_MS);
    }
  }

  private remove(id: number): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }
}