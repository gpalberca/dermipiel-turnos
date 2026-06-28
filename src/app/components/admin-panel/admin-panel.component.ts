import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCitasComponent } from '../admin-citas/admin-citas.component';
import { AdminTratamientosComponent } from '../admin-tratamientos/admin-tratamientos.component';
import { AdminHorariosComponent } from '../admin-horarios/admin-horarios.component';
import { AdminClientesComponent } from '../admin-clientes/admin-clientes.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    AdminCitasComponent,
    AdminTratamientosComponent,
    AdminHorariosComponent,
    AdminClientesComponent,
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent {
  constructor(public auth: AuthService) {}

  activeTab = signal<'citas' | 'tratamientos' | 'horarios' | 'clientes'>('citas');

  setTab(tab: 'citas' | 'tratamientos' | 'horarios' | 'clientes') {
    this.activeTab.set(tab);
  }
}