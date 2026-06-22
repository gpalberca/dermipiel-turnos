import { Component, Input, Output, EventEmitter, signal,
         OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Tratamiento } from '../../services/tratamientos.service';
import { Especialista } from '../../services/especialistas.service';
import { environment } from '../../../environments/environment';

export interface Categoria {
  id:     number;
  nombre: string;
}

@Component({
  selector: 'app-admin-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-modal-form.component.html',
  styleUrl:    './admin-modal-form.component.css'
})
export class AdminModalFormComponent implements OnInit, OnChanges {
  @Input() titulo   = 'Formulario';
  @Input() datos: Tratamiento = { nombre: '', descripcion: '', duracion_minutos: 30, precio: 0 };
  @Input() cargando = false;
  @Output() guardar = new EventEmitter<Tratamiento>();
  @Output() cerrar  = new EventEmitter<void>();

  formulario    = signal<Tratamiento>({ nombre: '', descripcion: '', duracion_minutos: 30, precio: 0 });
  categorias    = signal<Categoria[]>([]);
  especialistas = signal<Especialista[]>([]);
  previewUrl    = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.actualizarFormulario();
    this.cargarCatalogos();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datos']) this.actualizarFormulario();
  }

  private actualizarFormulario() {
    this.formulario.set({ ...this.datos });
    this.previewUrl.set(this.datos.imagen_url || null);
  }

  cargarCatalogos() {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`)
      .subscribe(c => this.categorias.set(c));
    this.http.get<Especialista[]>(`${environment.apiUrl}/especialistas`)
      .subscribe(e => this.especialistas.set(e));
  }

  onUrlImagen(url: string) {
    this.previewUrl.set(url || null);
    this.formulario.update(f => ({ ...f, imagen_url: url }));
  }

  guardarForm() { this.guardar.emit(this.formulario()); }
  cerrarForm()  { this.cerrar.emit(); }
}