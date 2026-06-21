import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosService, Horario, Excepcion } from '../../services/horarios.service';

@Component({
  selector: 'app-admin-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-horarios.component.html',
  styleUrl: './admin-horarios.component.css'
})
export class AdminHorariosComponent implements OnInit {
  horarios    = signal<Horario[]>([]);
  excepciones = signal<Excepcion[]>([]);
  cargando    = signal(true);

  // Edición horario
  editandoHorario = signal<number | null>(null);
  horarioEdit: Partial<Horario> = {};

  // Formulario excepción
  modoExcepcion  = signal<'crear' | 'editar' | null>(null);
  excepcionEdit: Excepcion = { fecha: '', motivo: '', hora_inicio: null, hora_fin: null };
  excepcionId    = signal<number | null>(null);
  esParcial      = signal(false);

  constructor(private svc: HorariosService) {}

  ngOnInit() { this.cargar(); }

  cargar() {
    this.cargando.set(true);
    this.svc.getHorarios().subscribe(h => this.horarios.set(h));
    this.svc.getExcepciones().subscribe(e => {
      this.excepciones.set(e);
      this.cargando.set(false);
    });
  }

  // ── Horarios ───────────────────────────────────────────────────
  editarHorario(h: Horario) {
    this.editandoHorario.set(h.id);
    this.horarioEdit = { hora_inicio: h.hora_inicio, hora_fin: h.hora_fin, intervalo_min: h.intervalo_min };
  }

  guardarHorario(id: number) {
    this.svc.updateHorario(id, this.horarioEdit).subscribe({
      next: () => { this.editandoHorario.set(null); this.cargar(); }
    });
  }

  cancelarHorario() { this.editandoHorario.set(null); }

  diasLabel(dias: string): string {
    try {
      const arr = JSON.parse(dias);
      return arr.map((d: string) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ');
    } catch { return dias; }
  }

  // ── Excepciones ───────────────────────────────────────────────
  abrirCrear() {
    this.excepcionEdit = { fecha: '', motivo: '', hora_inicio: null, hora_fin: null };
    this.esParcial.set(false);
    this.excepcionId.set(null);
    this.modoExcepcion.set('crear');
  }

  abrirEditar(e: Excepcion) {
    this.excepcionEdit = { ...e };
    this.esParcial.set(!!e.hora_inicio);
    this.excepcionId.set(e.id!);
    this.modoExcepcion.set('editar');
  }

  guardarExcepcion() {
    const data = {
      ...this.excepcionEdit,
      hora_inicio: this.esParcial() ? this.excepcionEdit.hora_inicio : null,
      hora_fin:    this.esParcial() ? this.excepcionEdit.hora_fin    : null
    };

    if (this.modoExcepcion() === 'crear') {
      this.svc.crearExcepcion(data).subscribe({ next: () => { this.modoExcepcion.set(null); this.cargar(); } });
    } else {
      this.svc.updateExcepcion(this.excepcionId()!, data).subscribe({ next: () => { this.modoExcepcion.set(null); this.cargar(); } });
    }
  }

  eliminarExcepcion(id: number) {
    if (confirm('¿Eliminar esta excepción?')) {
      this.svc.eliminarExcepcion(id).subscribe({ next: () => this.cargar() });
    }
  }

  cancelarExcepcion() { this.modoExcepcion.set(null); }

  esDiaCompleto(e: Excepcion): boolean {
    return !e.hora_inicio && !e.hora_fin;
  }
}