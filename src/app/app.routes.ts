import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { AgendarCitaComponent } from './components/agendar-cita/agendar-cita.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: InicioComponent },
  { path: 'agendar', component: AgendarCitaComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminPanelComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
