import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

const TOKEN_KEY = 'dp_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));

  isLoggedIn = computed(() => !!this._token());

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
