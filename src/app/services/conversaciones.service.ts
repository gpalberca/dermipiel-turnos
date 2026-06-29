// src/app/services/conversaciones.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConversacionResumen {
  session_id:      string;
  cliente_id:      number | null;
  cliente_nombre:  string | null;
  nombre_wa:       string | null;
  total_turnos:    number;
  inicio:          string;
  ultimo_turno:    string;
  ultimo_mensaje:  string;
  cita_id:         number | null;
  resultado:       'convertido' | 'sin_cita';
}

export interface Turno {
  id:               number;
  session_id:       string;
  cliente_id:       number | null;
  nombre_wa:        string | null;
  mensaje_usuario:  string;
  respuesta_agente: string;
  cita_id:          number | null;
  created_at:       string;
  cliente_nombre:   string | null;
  cliente_telefono: string | null;
  cliente_nivel:    string | null;
}

export interface ConversacionDetalle {
  meta: {
    session_id:        string;
    cliente_id:        number | null;
    cliente_nombre:    string | null;
    cliente_telefono:  string | null;
    cliente_nivel:     string | null;
    nombre_wa:         string | null;
    total_turnos:      number;
    inicio:            string;
    fin:               string;
    cita_id:           number | null;
  };
  turnos: Turno[];
}

export interface ConversacionesResponse {
  data:  ConversacionResumen[];
  total: number;
  page:  number;
  pages: number;
}

@Injectable({ providedIn: 'root' })
export class ConversacionesService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/conversaciones`;

  getConversaciones(filtros: {
    q?:        string;
    resultado?: string;
    periodo?:  string;
    page?:     number;
    limit?:    number;
  } = {}): Observable<ConversacionesResponse> {
    let params = new HttpParams();
    if (filtros.q)         params = params.set('q',         filtros.q);
    if (filtros.resultado) params = params.set('resultado', filtros.resultado);
    if (filtros.periodo)   params = params.set('periodo',   filtros.periodo);
    params = params.set('page',  filtros.page  ?? 1);
    params = params.set('limit', filtros.limit ?? 30);
    return this.http.get<ConversacionesResponse>(this.api, { params });
  }

  getDetalle(session_id: string): Observable<ConversacionDetalle> {
    return this.http.get<ConversacionDetalle>(`${this.api}/${session_id}`);
  }
}