import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule, DoorOpen, Badge, CheckCircle, XCircle, Info, AlertTriangle, Calendar, Dumbbell, BadgeCheck } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { AccesosService, ValidarAccesoDto, AccesoResponseDto } from '@api';
import { CommonModule, DatePipe } from '@angular/common';

interface SocioAcceso {
  nombre: string;
  apellido: string;
  dni: string;
  foto?: string;
  planNombre?: string;
  vencimiento?: Date;
  diasVencido?: number;
}

@Component({
  selector: 'app-acceso',
  standalone: true,
  imports: [LucideAngularModule, ReactiveFormsModule, CommonModule, DatePipe],
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
  readonly Calendar = Calendar;
  readonly Dumbbell = Dumbbell;
  readonly BadgeCheck = BadgeCheck;

  checkinForm = this.fb.nonNullable.group({
    dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]]
  });

  loading = signal(false);
  resultState = signal<'permitido' | 'rechazado' | 'excepcion' | null>(null);
  socio = signal<SocioAcceso | null>(null);
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

  private handleResponse(response: AccesoResponseDto) {
    if (response.resultado === 'permitido') {
      this.resultState.set('permitido');
      this.socio.set({
        nombre: response.socioNombre || '',
        apellido: '',
        dni: response.socioDni || '',
        foto: undefined,
        planNombre: undefined,
        vencimiento: undefined
      });
    } else {
      if (response.resultado === 'excepcion') {
        this.resultState.set('excepcion');
      } else {
        this.resultState.set('rechazado');
      }
      this.socio.set({
        nombre: response.socioNombre || '',
        apellido: '',
        dni: response.socioDni || '',
        foto: undefined,
        planNombre: undefined,
        vencimiento: undefined,
        diasVencido: undefined
      });
    }
  }

  simulateResult(state: 'permitido' | 'rechazado' | 'excepcion') {
    this.loading.set(true);
    this.error.set(null);

    setTimeout(() => {
      this.loading.set(false);
      this.resultState.set(state);

      // Mock data for simulation
      const mockData: Record<string, SocioAcceso> = {
        permitido: {
          nombre: 'Carlos',
          apellido: 'Mendoza Ramírez',
          dni: '45.678.901',
          planNombre: 'Musculación + Cardio',
          vencimiento: new Date('2024-10-15')
        },
        rechazado: {
          nombre: 'Lucía',
          apellido: 'Fernández Gomez',
          dni: '39.123.456',
          diasVencido: 24
        },
        excepcion: {
          nombre: 'Roberto',
          apellido: 'Silva',
          dni: '22.456.789'
        }
      };

      this.socio.set(mockData[state]);
    }, 500);
  }
}