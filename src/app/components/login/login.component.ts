import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  usuario = '';
  password = '';
  cargando = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    if (!this.usuario || !this.password) {
      this.error.set('Completa todos los campos.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.auth.login(this.usuario, this.password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => {
        this.error.set('Usuario o contraseña incorrectos.');
        this.cargando.set(false);
      }
    });
  }
}
