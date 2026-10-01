import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, BadgeCheck, CreditCard, Settings, Store, Users } from 'lucide-angular';
import { MainLayoutComponent } from '@shared/components/layout';
import { RolUsuario, RoleService } from '@core/services/role.service';
import { crossfade } from '@shared/utils/animations';
import { SeccionMembresiasComponent } from './sections/seccion-membresias.component';
import { SeccionCatalogosComponent } from './sections/seccion-catalogos.component';
import { SeccionClientesComponent } from './sections/seccion-clientes.component';
import { SeccionUsuariosComponent } from './sections/seccion-usuarios.component';

type ConfigTab = 'membresias' | 'catalogos' | 'clientes' | 'usuarios';

interface TabConfig {
  id: ConfigTab;
  label: string;
  icon: any;
  description: string;
  roles: RolUsuario[];
}

const SOLO_SUPER_ADMIN: RolUsuario[] = ['super_admin'];

@Component({
  selector: 'app-configuracion',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    LucideAngularModule,
    SeccionMembresiasComponent,
    SeccionCatalogosComponent,
    SeccionClientesComponent,
    SeccionUsuariosComponent
  ],
  animations: [crossfade],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  private readonly layout = inject(MainLayoutComponent);
  private readonly roleService = inject(RoleService);

  readonly Settings = Settings;

  private readonly allTabs: TabConfig[] = [
    { id: 'clientes', label: 'Negocios (clientes)', icon: Store, description: 'Alta y edición de clientes', roles: SOLO_SUPER_ADMIN },
    { id: 'usuarios', label: 'Usuarios del staff', icon: Users, description: 'Accesos y roles', roles: SOLO_SUPER_ADMIN },
    { id: 'membresias', label: 'Planes y precios', icon: BadgeCheck, description: 'Precios y días por semana', roles: SOLO_SUPER_ADMIN },
    { id: 'catalogos', label: 'Medios de pago y rubros', icon: CreditCard, description: 'Catálogos globales', roles: SOLO_SUPER_ADMIN }
  ];

  readonly activeTab = signal<ConfigTab>('clientes');

  readonly tabs = computed(() => this.allTabs.filter(tab => this.roleService.hasAnyRole(tab.roles)));

  constructor() {
    effect(() => {
      const tabs = this.tabs();
      if (tabs.length === 0) return;
      if (!tabs.some(tab => tab.id === this.activeTab())) {
        this.activeTab.set(tabs[0].id);
      }
    });
  }

  ngOnInit(): void {
    this.layout.setPageTitle('Configuración');
  }

  onTabChange(tab: ConfigTab): void {
    this.activeTab.set(tab);
  }
}