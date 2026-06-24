import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tratamiento, TratamientosService } from '../../services/tratamientos.service';
import { Especialista, EspecialistasService } from '../../services/especialistas.service';
import { AdminModalFormComponent } from '../admin-modal-form/admin-modal-form.component';

@Component({
  selector: 'app-admin-tratamientos',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminModalFormComponent],
  templateUrl: './admin-tratamientos.component.html',
  styleUrl: './admin-tratamientos.component.css'
})
export class AdminTratamientosComponent implements OnInit {
  subtab = signal<'tratamientos' | 'especialistas'>('tratamientos');

  // Tratamientos
  tratamientos  = signal<Tratamiento[]>([]);
  cargando      = signal(true);
  modalAbierto  = signal(false);
  modalCargando = signal(false);
  tratamientoEdicion?: Tratamiento;
  esEdicion     = signal(false);

  // Especialistas
  especialistas      = signal<Especialista[]>([]);
  cargandoEsp        = signal(false);
  modoEsp            = signal<'crear' | 'editar' | null>(null);
  especialistaEdit: Especialista = { nombres: '', apellidos: '', email: '', telefono: '', horario_id: null };
  especialistaId     = signal<number | null>(null);

  constructor(
    private tratamientosService: TratamientosService,
    private especialistasService: EspecialistasService
  ) {}

  ngOnInit() {
    this.cargarTratamientos();
    this.cargarEspecialistas();
  }

  // ── Tratamientos ───────────────────────────────────────────
  cargarTratamientos() {
    this.cargando.set(true);
    this.tratamientosService.getTratamientosAdmin().subscribe({
      next:  data => { this.tratamientos.set(data); this.cargando.set(false); },
      error: ()   => this.cargando.set(false)
    });
  }

  abrirCrear() {
    this.tratamientoEdicion = { nombre: '', descripcion: '', duracion_minutos: 30, precio: 0, visible_agente: 0 };
    this.esEdicion.set(false);
    this.modalAbierto.set(true);
  }

  abrirEditar(t: Tratamiento) {
    this.tratamientoEdicion = { ...t };
    this.esEdicion.set(true);
    this.modalAbierto.set(true);
  }

  cerrarModal() { this.modalAbierto.set(false); this.tratamientoEdicion = undefined; }

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
      next:  () => { this.cargarTratamientos(); this.cerrarModal(); this.modalCargando.set(false); },
      error: () => { alert('Error al guardar.'); this.modalCargando.set(false); }
    });
  }

  eliminar(id?: number) {
    if (id && confirm('¿Eliminar este tratamiento?')) {
      this.tratamientosService.eliminarTratamiento(id).subscribe({
        next:  () => this.cargarTratamientos(),
        error: () => alert('Error al eliminar.')
      });
    }
  }

  toggleAgente(t: Tratamiento) {
    if (!t.id) return;
    this.tratamientosService.toggleAgente(t.id).subscribe({
      next: (res) => {
        this.tratamientos.update(list =>
          list.map(item => item.id === t.id
            ? { ...item, visible_agente: res.visible_agente }
            : item
          )
        );
      },
      error: () => alert('Error al actualizar visibilidad del agente.')
    });
  }

  // ── Especialistas ──────────────────────────────────────────
  cargarEspecialistas() {
    this.cargandoEsp.set(true);
    this.especialistasService.getEspecialistas().subscribe({
      next:  data => { this.especialistas.set(data); this.cargandoEsp.set(false); },
      error: ()   => this.cargandoEsp.set(false)
    });
  }

  abrirCrearEsp() {
    this.especialistaEdit = { nombres: '', apellidos: '', email: '', telefono: '', horario_id: null };
    this.especialistaId.set(null);
    this.modoEsp.set('crear');
  }

  abrirEditarEsp(e: Especialista) {
    this.especialistaEdit = { ...e };
    this.especialistaId.set(e.id!);
    this.modoEsp.set('editar');
  }

  guardarEsp() {
    if (!this.especialistaEdit.nombres || !this.especialistaEdit.apellidos) {
      alert('Nombres y apellidos son obligatorios.');
      return;
    }
    const obs = this.modoEsp() === 'crear'
      ? this.especialistasService.crear(this.especialistaEdit)
      : this.especialistasService.actualizar(this.especialistaId()!, this.especialistaEdit);

    obs.subscribe({
      next:  () => { this.modoEsp.set(null); this.cargarEspecialistas(); },
      error: () => alert('Error al guardar especialista.')
    });
  }

  eliminarEsp(id?: number) {
    if (id && confirm('¿Eliminar este especialista?')) {
      this.especialistasService.eliminar(id).subscribe({
        next:  () => this.cargarEspecialistas(),
        error: () => alert('No se puede eliminar: tiene tratamientos asignados.')
      });
    }
  }

  cancelarEsp() { this.modoEsp.set(null); }
}