import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cita {
  id?:                number;
  nombre_paciente:    string;
  email:              string;
  telefono:           string;
  tratamiento_id:     number;
  fecha_hora:         string;
  estado?:            string;
  notas?:             string;
  created_at?:        string;
  // Campos del JOIN
  tratamiento_nombre?: string;
  duracion_minutos?:   number;
  precio?:             number;
  categoria?:          string;
  especialista?:       string;
  especialista_id?:    number;
}

@Injectable({ providedIn: 'root' })
export class CitasService {
  private apiUrl = `${environment.apiUrl}/citas`;

  constructor(private http: HttpClient) {}

  getCitas(): Observable<Cita[]> {
    return this.http.get<Cita[]>(this.apiUrl);
  }

  crearCita(cita: Cita): Observable<Cita> {
    return this.http.post<Cita>(this.apiUrl, cita);
  }

  cancelarCita(id: number): Observable<Cita> {
    return this.http.patch<Cita>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  confirmarCita(id: number): Observable<Cita> {
    return this.http.patch<Cita>(`${this.apiUrl}/${id}/confirmar`, {});
  }

  completarCita(id: number): Observable<Cita> {
    return this.http.patch<Cita>(`${this.apiUrl}/${id}/completar`, {});
  }
}