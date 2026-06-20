import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tratamiento {
  id?: number;
  nombre: string;
  descripcion: string;
  duracion_minutos: number;
  precio: number;
  imagen_url?: string;
  etiqueta?: string;
}

@Injectable({ providedIn: 'root' })
export class TratamientosService {
  private apiUrl = `${environment.apiUrl}/tratamientos`;

  constructor(private http: HttpClient) {}

  getTratamientos(): Observable<Tratamiento[]> {
    return this.http.get<Tratamiento[]>(this.apiUrl);
  }

  crearTratamiento(tratamiento: Tratamiento): Observable<Tratamiento> {
    return this.http.post<Tratamiento>(this.apiUrl, tratamiento);
  }

  actualizarTratamiento(id: number, tratamiento: Tratamiento): Observable<Tratamiento> {
    return this.http.put<Tratamiento>(`${this.apiUrl}/${id}`, tratamiento);
  }

  eliminarTratamiento(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
