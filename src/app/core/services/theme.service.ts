import { Injectable, PLATFORM_ID, Signal, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'ctrlasis_theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly modeSignal = signal<ThemeMode>('light');

  readonly mode: Signal<ThemeMode> = this.modeSignal.asReadonly();

  constructor() {
    this.modeSignal.set(this.resolveInitialMode());
    this.apply();
  }

  toggle(): void {
    this.setMode(this.modeSignal() === 'light' ? 'dark' : 'light');
  }

  setMode(mode: ThemeMode): void {
    if (mode === this.modeSignal()) return;
    this.modeSignal.set(mode);
    this.apply();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  private resolveInitialMode(): ThemeMode {
    if (!isPlatformBrowser(this.platformId)) return 'light';
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private apply(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.classList.toggle('dark', this.modeSignal() === 'dark');
  }
}