import { ChangeDetectionStrategy, Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-angular';
import { Toast, ToastService, ToastType } from '@core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);

  readonly toasts = this.toastService.toasts;
  readonly closeIcon = X;

  private readonly icons: {
    success: typeof CheckCircle;
    error: typeof XCircle;
    warning: typeof AlertTriangle;
    info: typeof Info;
  } = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  };

  iconFor(type: ToastType) {
    return this.icons[type];
  }

  onProgressEnd(toast: Toast): void {
    this.toastService.dismiss(toast.id);
  }

  dismiss(toast: Toast): void {
    this.toastService.dismiss(toast.id);
  }

  @HostListener('window:keydown.escape')
  onEscapeKeydown(): void {
    const top = this.toasts()[0];
    if (top) {
      this.toastService.dismiss(top.id);
    }
  }
}