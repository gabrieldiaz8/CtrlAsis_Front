import { Component, inject, signal, OnInit } from '@angular/core';
import { LucideAngularModule, Loader2, Building, Save, AlertCircle, CheckCircle, Edit, Tag } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { NegocioService, NegocioResponseDto, UpdateNegocioDto } from '@api';
import { CatalogosService, RubroResponseDto } from '@api';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  private layout = inject(MainLayoutComponent);
  private negocioService = inject(NegocioService);
  private catalogosService = inject(CatalogosService);
  private fb = inject(FormBuilder);

  readonly Loader2 = Loader2;
  readonly Building = Building;
  readonly Save = Save;
  readonly AlertCircle = AlertCircle;
  readonly CheckCircle = CheckCircle;
  readonly Edit = Edit;
  readonly Tag = Tag;

  loading = signal(true);
  saving = signal(false);
  negocio = signal<NegocioResponseDto | null>(null);
  rubros = signal<RubroResponseDto[]>([]);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  negocioForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    rubroId: ['', [Validators.required]]
  });

  ngOnInit() {
    this.layout.setPageTitle('Configuración');
    this.loadRubros();
    this.loadNegocio();
  }

  loadRubros() {
    this.catalogosService.catalogosControllerFindAllRubros().subscribe({
      next: (data) => this.rubros.set(data.filter(r => r.activo)),
      error: () => console.error('Error loading rubros')
    });
  }

  loadNegocio() {
    this.loading.set(true);
    this.error.set(null);
    
    this.negocioService.negociosControllerFindByCurrentUser().subscribe({
      next: (data) => {
        this.negocio.set(data);
        this.negocioForm.patchValue({
          nombre: data.nombre,
          rubroId: String(data.rubroId)
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar la configuración del negocio');
        this.loading.set(false);
        console.error('Error loading negocio:', err);
      }
    });
  }

  onSubmit() {
    if (this.negocioForm.invalid) {
      this.negocioForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    const formData = this.negocioForm.getRawValue();
    const updateData: UpdateNegocioDto = {
      nombre: formData.nombre,
      rubroId: String(formData.rubroId)
    };

    this.negocioService.negociosControllerUpdate(updateData).subscribe({
      next: (updated) => {
        this.negocio.set(updated);
        this.saving.set(false);
        this.success.set('Configuración guardada correctamente');
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || 'Error al guardar la configuración');
        console.error('Error updating negocio:', err);
      }
    });
  }
}