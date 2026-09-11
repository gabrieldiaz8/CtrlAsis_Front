import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, DoorOpen, Badge, CheckCircle, XCircle, Info, AlertTriangle, BadgeCheck, Loader2 } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { AccesosService, ValidarAccesoDto, AccesoResponseDto } from '@api';
import { CommonModule } from '@angular/common';

interface SocioAcceso {
  nombre: string;
  apellido: string;
  dni: string;
  observacion: string;
}

type ResultadoAcceso = 'permitido' | 'rechazado' | 'excepcion' | 'excepcion_confirmada' | null;

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [LucideAngularModule, ReactiveFormsModule, CommonModule],
  templateUrl: './acceso.component.html',
  styleUrl: './acceso.component.css'
})
export class AccesoComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private fb = inject(FormBuilder);
  private accesosService = inject(AccesosService);

  readonly DoorOpen = DoorOpen;
  readonly Badge = Badge;
  readonly CheckCircle = CheckCircle;
  readonly XCircle = XCircle;
  readonly Info = Info;
  readonly AlertTriangle = AlertTriangle;
  readonly BadgeCheck = BadgeCheck;
  readonly Loader2 = Loader2;

  checkinForm = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]]
  });

  observacionControl = new FormControl('');

  loading = signal(false);
  forzandoIngreso = signal(false);
  resultState = signal<ResultadoAcceso>(null);
  socio = signal<SocioAcceso | null>(null);
  ultimoAccesoId = signal<string | null>(null);
  error = signal<string | null>(null);

  ngOnInit() {
    this.layout.setPageTitle('Control de Acceso');
  }

  onValidate() {
    if (this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.resultState.set(null);
    this.ultimoAccesoId.set(null);

    const dni = this.checkinForm.value.dni!;

    this.accesosService.accesosControllerValidar({ dni } as ValidarAccesoDto).subscribe({
      next: (response: AccesoResponseDto) => {
        this.loading.set(false);
        this.handleResponse(response);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al validar acceso');
        console.error(err);
      }
    });
  }

  onForzarIngreso() {
    const id = this.ultimoAccesoId();
    if (!id) {
      this.error.set('No hay un acceso pendiente para forzar el ingreso');
      return;
    }

    this.forzandoIngreso.set(true);
    this.error.set(null);

    const observacion = this.observacionControl.value?.trim() || 'Autorizado por recepción';

    this.accesosService.accesosControllerExcepcion(id, { observacion }).subscribe({
      next: (response: AccesoResponseDto) => {
        this.forzandoIngreso.set(false);
        this.applyResponse(response);
        this.resultState.set('excepcion_confirmada');
      },
      error: (err: any) => {
        this.forzandoIngreso.set(false);
        this.error.set(err.error?.message || 'Error al registrar la excepción');
        console.error(err);
      }
    });
  }

  private handleResponse(response: AccesoResponseDto) {
    if (response.resultado === 'permitido') {
      this.resultState.set('permitido');
    } else if (response.resultado === 'excepcion') {
      this.resultState.set('excepcion');
    } else {
      this.resultState.set('rechazado');
    }
    this.applyResponse(response);
  }

  private applyResponse(response: AccesoResponseDto) {
    this.ultimoAccesoId.set(response.id);
    const parts = (response.socioNombre || ' ').trim().split(' ');
    const nombre = parts[0] || '';
    const apellido = parts.slice(1).join(' ');
    this.socio.set({
      nombre,
      apellido,
      dni: response.socioDni || '',
      observacion: response.observacion || ''
    });
  }

  getInitials(nombre: string, apellido: string): string {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  }

  getAvatarColor(id: string): string {
    const numId = parseInt(id, 10) || 0;
    const colors = ['bg-primary-fixed-dim text-on-primary-fixed-variant', 'bg-secondary-container text-on-secondary-container', 'bg-tertiary-container text-on-tertiary-container'];
    return colors[numId % colors.length];
  }
}