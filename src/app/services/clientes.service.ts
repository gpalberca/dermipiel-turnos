    // src/app/services/clientes.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Cliente {
  id:                number;
  nombre:            string;
  telefono:          string;
  email:             string | null;
  fuente:            'web' | 'whatsapp' | 'manual';
  notas:             string | null;
  activo:            number;
  created_at:        string;
  total_citas:       number;
  ultima_cita:       string | null;
  citas_completadas: number;
  citas_proximas:    number;
}

export interface ClientesResponse {
  data:  Cliente[];
  total: number;
  page:  number;
  pages: number;
}

export interface ClienteDetalle extends Cliente {
  citas: {
    id:           number;
    fecha_hora:   string;
    estado:       string;
    notas:        string | null;
    tratamiento:  string | null;
    precio:       number | null;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private http = inject(HttpClient);
  private api  = `${environment.apiUrl}/clientes`;

  getClientes(filtros: {
    q?:      string;
    fuente?: string;
    activo?: string;
    page?:   number;
    limit?:  number;
  } = {}): Observable<ClientesResponse> {
    let params = new HttpParams();
    if (filtros.q)      params = params.set('q',      filtros.q);
    if (filtros.fuente) params = params.set('fuente', filtros.fuente);
    if (filtros.activo !== undefined && filtros.activo !== '')
                        params = params.set('activo', filtros.activo);
    params = params.set('page',  filtros.page  ?? 1);
    params = params.set('limit', filtros.limit ?? 20);
    return this.http.get<ClientesResponse>(this.api, { params });
  }

  getCliente(id: number): Observable<ClienteDetalle> {
    return this.http.get<ClienteDetalle>(`${this.api}/${id}`);
  }

  crearCliente(data: Partial<Cliente>): Observable<{ id: number; es_nuevo: boolean; message: string }> {
    return this.http.post<{ id: number; es_nuevo: boolean; message: string }>(this.api, data);
  }

  editarCliente(id: number, data: Partial<Cliente>): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/${id}`, data);
  }

  toggleActivo(id: number): Observable<{ message: string; activo: number }> {
    return this.http.patch<{ message: string; activo: number }>(`${this.api}/${id}/toggle`, {});
  }
}