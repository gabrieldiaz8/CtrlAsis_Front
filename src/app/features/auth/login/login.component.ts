import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, KeyRound } from 'lucide-angular';
import { AuthService } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastService } from '@core/services/toast.service';
import { RoleService } from '@core/services/role.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toast = inject(ToastService);
  private roleService = inject(RoleService);

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Loader2 = Loader2;
  readonly ArrowRight = ArrowRight;
  readonly KeyRound = KeyRound;

  showPassword = signal(false);
  loading = signal(false);
  rememberMe = signal(false);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.authControllerLogin({ email, password }).subscribe({
      next: (response) => {
        // Guardar JWT en localStorage
        if (response.accessToken) {
          localStorage.setItem('access_token', response.accessToken);
          
          // Guardar datos del usuario si vienen en la respuesta
          if (response.user) {
            localStorage.setItem('user_data', JSON.stringify(response.user));
          }
          
          // Guardar preferencia "recordarme"
          if (this.rememberMe()) {
            localStorage.setItem('remember_me', 'true');
          } else {
            localStorage.removeItem('remember_me');
          }
        }
        
        this.loading.set(false);
        this.roleService.refresh();
        this.router.navigateByUrl(this.roleService.homeRoute());
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Credenciales inválidas. Intente nuevamente.', { title: 'Error de acceso' });
        console.error('Login error:', err);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onRememberMeChange(event: Event) {
    this.rememberMe.set((event.target as HTMLInputElement).checked);
  }
}