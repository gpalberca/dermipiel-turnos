import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CitasService, Cita } from '../../services/citas.service';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './agendar-cita.component.html',
  styleUrl: './agendar-cita.component.css'
})
export class AgendarCitaComponent implements OnInit {
  tratamientos = signal<Tratamiento[]>([]);
  enviando = signal(false);
  exito = signal(false);
  error = signal('');

  cita: Cita = {
    nombre_paciente: '',
    email: '',
    telefono: '',
    tratamiento_id: 0,
    fecha_hora: ''
  };

  selectedDate = '';
  selectedTime = '';
  tratamientoSeleccionado?: Tratamiento;
  pendingTratamientoId = 0;

  availableTimes = [
    '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30'
  ];

  constructor(
    private citasService: CitasService,
    private tratamientosService: TratamientosService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const id = Number(params['tratamiento'] || 0);
      if (id > 0) {
        this.pendingTratamientoId = id;
        this.cita.tratamiento_id = id;
      }
    });

    this.tratamientosService.getTratamientos().subscribe({
      next: (data) => {
        this.tratamientos.set(data);
        if (this.pendingTratamientoId) {
          this.tratamientoSeleccionado = this.tratamientos().find((t) => t.id === this.pendingTratamientoId);
          if (this.tratamientoSeleccionado?.id) {
            this.cita.tratamiento_id = this.tratamientoSeleccionado.id;
          }
        } else {
          this.updateTratamientoSeleccionado();
        }
      }
    });
  }

  enviarCita() {
    if (!this.cita.nombre_paciente || !this.cita.tratamiento_id || !this.cita.fecha_hora) {
      this.error.set('Por favor completa todos los campos obligatorios.');
      return;
    }
    this.enviando.set(true);
    this.error.set('');
    this.citasService.crearCita(this.cita).subscribe({
      next: () => {
        this.exito.set(true);
        this.enviando.set(false);
        this.cita = { nombre_paciente: '', email: '', telefono: '', tratamiento_id: 0, fecha_hora: '' };
        this.selectedDate = '';
        this.selectedTime = '';
        this.tratamientoSeleccionado = undefined;
      },
      error: (err) => {
        this.error.set('Error al agendar la cita. Intenta de nuevo.');
        this.enviando.set(false);
      }
    });
  }

  onTratamientoChange() {
    this.updateTratamientoSeleccionado();
  }

  updateTratamientoSeleccionado() {
    this.tratamientoSeleccionado = this.tratamientos().find((t) => t.id === this.cita.tratamiento_id);
  }

  onDateSelected(value: string) {
    this.selectedDate = value;
    this.selectedTime = '';
    this.cita.fecha_hora = '';
  }

  elegirHora(hora: string) {
    this.selectedTime = hora;
    if (this.selectedDate) {
      this.cita.fecha_hora = `${this.selectedDate}T${hora}`;
    }
  }
}
