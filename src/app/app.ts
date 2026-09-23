import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastComponent } from '@shared/components/toast/toast.component';
import { A11yDialogManagerDirective } from '@core/directives/a11y-dialog-manager.directive';

@Component({
  selector: 'app-root',
  imports: [RouterModule, ToastComponent, A11yDialogManagerDirective],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = 'CtrlAsis';
}