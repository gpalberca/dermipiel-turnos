import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tratamiento } from '../../services/tratamientos.service';

@Component({
  selector: 'app-admin-modal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-modal-form.component.html',
  styleUrl: './admin-modal-form.component.css'
})
export class AdminModalFormComponent implements OnInit, OnChanges {
  @Input() titulo = 'Formulario';
  @Input() datos: Tratamiento = { nombre: '', descripcion: '', duracion_minutos: 30, precio: 0 };
  @Input() cargando = false;
  @Output() guardar = new EventEmitter<Tratamiento>();
  @Output() cerrar = new EventEmitter<void>();

  formulario = signal<Tratamiento>({ nombre: '', descripcion: '', duracion_minutos: 30, precio: 0 });

  ngOnInit() {
    this.actualizarFormulario();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['datos']) {
      this.actualizarFormulario();
    }
  }

  private actualizarFormulario() {
    this.formulario.set({ ...this.datos });
  }

  guardarForm() {
    this.guardar.emit(this.formulario());
  }

  cerrarForm() {
    this.cerrar.emit();
  }
}
