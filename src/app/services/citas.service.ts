import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cita {
  id?: number;
  nombre_paciente: string;
  email: string;
  telefono: string;
  tratamiento_id: number;
  fecha_hora: string;
  estado?: string;
  tratamiento_nombre?: string;
  duracion_minutos?: number;
}

@Injectable({ providedIn: 'root' })
export class CitasService {
  private apiUrl = 'http://localhost:3000/api/citas';

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
}
