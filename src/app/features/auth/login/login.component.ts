import { Component, inject, signal } from '@angular/core';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-angular';
import { AuthService } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Loader2 = Loader2;
  readonly ArrowRight = ArrowRight;

  showPassword = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
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
    this.error.set(null);

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
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Credenciales inválidas. Intente nuevamente.');
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