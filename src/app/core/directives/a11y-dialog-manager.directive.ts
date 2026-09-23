import { Directive, HostListener, inject, ElementRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  'summary'
].join(', ');

/**
 * Gestor global de dialogs: cuando hay un elemento `[aria-modal="true"]`
 * visible en el DOM, atrapa la navegación por Tab dentro de él y, al abrirse,
 * mueve el foco al primer elemento focuseable (patrón WAI-ARIA dialog).
 * Los modales individuales ya se cierran con Escape en sus componentes.
 */
@Directive({
  selector: '[appA11yDialogManager]',
  standalone: true
})
export class A11yDialogManagerDirective {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer: MutationObserver | null = null;

  private get activeDialog(): HTMLElement | null {
    if (!isPlatformBrowser(this.platformId) || !this.elementRef.nativeElement?.isConnected) {
      return null;
    }
    const dialogs = this.elementRef.nativeElement.querySelectorAll<HTMLElement>('[aria-modal="true"]');
    for (const dialog of dialogs) {
      if (dialog.offsetParent !== null || dialog.getClientRects().length > 0) {
        return dialog;
      }
    }
    return null;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.observer = new MutationObserver(() => {
      const dialog = this.activeDialog;
      if (dialog && !dialog.contains(document.activeElement)) {
        this.focusFirst(dialog);
      }
    });
    this.observer.observe(this.elementRef.nativeElement, { childList: true, subtree: true });
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTabKeydown(event: Event): void {
    const kbEvent = event as KeyboardEvent;
    const dialog = this.activeDialog;
    if (!dialog) return;

    const focusables = this.focusables(dialog);
    if (focusables.length === 0) {
      kbEvent.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (kbEvent.shiftKey) {
      if (!active || active === first || !dialog.contains(active)) {
        kbEvent.preventDefault();
        last.focus();
      }
    } else if (!active || active === last || !dialog.contains(active)) {
      kbEvent.preventDefault();
      first.focus();
    }
  }

  private focusables(scope: HTMLElement): HTMLElement[] {
    return Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null || el.getClientRects().length > 0
    );
  }

  private focusFirst(scope: HTMLElement): void {
    const focusables = this.focusables(scope);
    const target = focusables[0] ?? scope;
    target.focus();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}