import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tratamiento, TratamientosService } from '../../services/tratamientos.service';
import { AdminModalFormComponent } from '../admin-modal-form/admin-modal-form.component';

@Component({
  selector: 'app-admin-tratamientos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminModalFormComponent],
  templateUrl: './admin-tratamientos.component.html',
  styleUrl: './admin-tratamientos.component.css'
})
export class AdminTratamientosComponent implements OnInit {
  tratamientos = signal<Tratamiento[]>([]);
  cargando = signal(true);
  modalAbierto = signal(false);
  modalCargando = signal(false);
  tratamientoEdicion?: Tratamiento;
  esEdicion = signal(false);

  constructor(private tratamientosService: TratamientosService) {}

  ngOnInit() {
    this.cargarTratamientos();
  }

  cargarTratamientos() {
    this.cargando.set(true);
    this.tratamientosService.getTratamientos().subscribe({
      next: (data) => {
        this.tratamientos.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  abrirCrear() {
    this.tratamientoEdicion = { nombre: '', descripcion: '', duracion_minutos: 30, precio: 0 };
    this.esEdicion.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(t: Tratamiento) {
    this.tratamientoEdicion = { ...t };
    this.esEdicion.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal() {
    this.modalAbierto.set(false);
    this.tratamientoEdicion = undefined;
  }

  guardar(datos: Tratamiento) {
    if (!datos.nombre || !datos.descripcion || !datos.duracion_minutos || !datos.precio) {
      alert('Completa todos los campos.');
      return;
    }

    this.modalCargando.set(true);
    const accion = this.esEdicion() && datos.id
      ? this.tratamientosService.actualizarTratamiento(datos.id, datos)
      : this.tratamientosService.crearTratamiento(datos);

    accion.subscribe({
      next: () => {
        this.cargarTratamientos();
        this.cerrarModal();
        this.modalCargando.set(false);
      },
      error: () => {
        alert('Error al guardar el tratamiento.');
        this.modalCargando.set(false);
      }
    });
  }

  eliminar(id?: number) {
    if (id && confirm('¿Estás seguro de eliminar este tratamiento?')) {
      this.tratamientosService.eliminarTratamiento(id).subscribe({
        next: () => this.cargarTratamientos(),
        error: () => alert('Error al eliminar el tratamiento.')
      });
    }
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-EC', {
      dateStyle: 'medium', timeStyle: 'short'
    });
  }
}
