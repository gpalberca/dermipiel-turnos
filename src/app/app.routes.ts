import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { AgendarCitaComponent } from './components/agendar-cita/agendar-cita.component';
import { AdminCitasComponent } from './components/admin-citas/admin-citas.component';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'agendar', component: AgendarCitaComponent },
  { path: 'admin', component: AdminCitasComponent },
  { path: '**', redirectTo: '' }
];
