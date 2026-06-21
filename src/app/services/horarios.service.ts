import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Horario {
  id:            number;
  dias_atencion: string;
  hora_inicio:   string;
  hora_fin:      string;
  intervalo_min: number;
}

export interface Excepcion {
  id?:          number;
  fecha:        string;
  motivo:       string;
  hora_inicio?: string | null;
  hora_fin?:    string | null;
  aplica_a?:    string;
}

@Injectable({ providedIn: 'root' })
export class HorariosService {
  private urlHorarios    = `${environment.apiUrl}/horarios`;
  private urlExcepciones = `${environment.apiUrl}/excepciones`;

  constructor(private http: HttpClient) {}

  // Horarios
  getHorarios(): Observable<Horario[]> {
    return this.http.get<Horario[]>(this.urlHorarios);
  }
  updateHorario(id: number, data: Partial<Horario>): Observable<Horario> {
    return this.http.put<Horario>(`${this.urlHorarios}/${id}`, data);
  }

  // Excepciones
  getExcepciones(): Observable<Excepcion[]> {
    return this.http.get<Excepcion[]>(this.urlExcepciones);
  }
  crearExcepcion(data: Excepcion): Observable<Excepcion> {
    return this.http.post<Excepcion>(this.urlExcepciones, data);
  }
  updateExcepcion(id: number, data: Excepcion): Observable<Excepcion> {
    return this.http.put<Excepcion>(`${this.urlExcepciones}/${id}`, data);
  }
  eliminarExcepcion(id: number): Observable<any> {
    return this.http.delete(`${this.urlExcepciones}/${id}`);
  }
}