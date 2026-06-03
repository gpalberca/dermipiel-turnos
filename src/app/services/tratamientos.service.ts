import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/api/tratamientos';

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
