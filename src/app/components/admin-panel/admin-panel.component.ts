import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCitasComponent } from '../admin-citas/admin-citas.component';
import { AdminTratamientosComponent } from '../admin-tratamientos/admin-tratamientos.component';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, AdminCitasComponent, AdminTratamientosComponent],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.css'
})
export class AdminPanelComponent {
  activeTab = signal<'citas' | 'tratamientos'>('citas');

  setTab(tab: 'citas' | 'tratamientos') {
    this.activeTab.set(tab);
  }
}
