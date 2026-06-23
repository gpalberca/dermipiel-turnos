import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'dp_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  isLoggedIn = computed(() => !!this._token());

  userName = computed(() => {
    const token = this._token();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.nombre ?? payload.usuario ?? payload.name ?? null;
    } catch {
      return null;
    }
  });

  constructor(private http: HttpClient, private router: Router) {}

  login(usuario: string, password: string) {
    return this.http
      .post<{ token: string }>(`${this.apiUrl}/login`, { usuario, password })
      .pipe(tap(res => {
        localStorage.setItem(TOKEN_KEY, res.token);
        this._token.set(res.token);
      }));
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._token();
  }
}