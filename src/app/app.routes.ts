import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { AgendarCitaComponent } from './components/agendar-cita/agendar-cita.component';
import { AdminCitasComponent } from './components/admin-citas/admin-citas.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'agendar', component: AgendarCitaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminCitasComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
