import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Especialista {
  id?:        number;
  nombres:    string;
  apellidos:  string;
  email?:     string;
  telefono?:  string;
  horario_id?: number | null;
  hora_inicio?: string;
  hora_fin?:    string;
  dias_atencion?: string;
}

@Injectable({ providedIn: 'root' })
export class EspecialistasService {
  private apiUrl = `${environment.apiUrl}/especialistas`;
  constructor(private http: HttpClient) {}

  getEspecialistas(): Observable<Especialista[]> {
    return this.http.get<Especialista[]>(this.apiUrl);
  }
  crear(data: Especialista): Observable<Especialista> {
    return this.http.post<Especialista>(this.apiUrl, data);
  }
  actualizar(id: number, data: Especialista): Observable<Especialista> {
    return this.http.put<Especialista>(`${this.apiUrl}/${id}`, data);
  }
  eliminar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}