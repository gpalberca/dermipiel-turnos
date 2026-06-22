import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CitasService, Cita } from '../../services/citas.service';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Slot {
  hora:       string;
  fecha_hora: string;
  disponible: boolean;
}

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './agendar-cita.component.html',
  styleUrl: './agendar-cita.component.css'
})
export class AgendarCitaComponent implements OnInit {
  tratamientos          = signal<Tratamiento[]>([]);
  slots                 = signal<Slot[]>([]);
  cargandoSlots         = signal(false);
  enviando              = signal(false);
  exito                 = signal(false);
  error                 = signal('');
  sinAtencion           = signal(false);

  cita: Cita = {
    nombre_paciente: '',
    email: '',
    telefono: '',
    tratamiento_id: 0,
    fecha_hora: ''
  };

  selectedDate             = '';
  selectedTime             = '';
  tratamientoSeleccionado?: Tratamiento;
  pendingTratamientoId     = 0;

  constructor(
    private citasService:       CitasService,
    private tratamientosService: TratamientosService,
    private route:               ActivatedRoute,
    private http:                HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const id = Number(params['tratamiento'] || 0);
      if (id > 0) {
        this.pendingTratamientoId = id;
        this.cita.tratamiento_id  = id;
      }
    });

    this.tratamientosService.getTratamientos().subscribe({
      next: data => {
        this.tratamientos.set(data);
        if (this.pendingTratamientoId) {
          this.tratamientoSeleccionado = data.find(t => t.id === this.pendingTratamientoId);
          if (this.tratamientoSeleccionado?.id) {
            this.cita.tratamiento_id = this.tratamientoSeleccionado.id;
          }
        } else {
          this.updateTratamientoSeleccionado();
        }
      }
    });
  }

  onDateSelected(value: string) {
    this.selectedDate  = value;
    this.selectedTime  = '';
    this.cita.fecha_hora = '';
    this.slots.set([]);
    this.sinAtencion.set(false);

    if (value && this.cita.tratamiento_id) {
      this.cargarSlots(value);
    }
  }

  onTratamientoChange() {
    this.updateTratamientoSeleccionado();
    this.selectedDate    = '';
    this.selectedTime    = '';
    this.cita.fecha_hora = '';
    this.slots.set([]);
  }

  cargarSlots(fecha: string) {
    this.cargandoSlots.set(true);
    this.http.get<any>(
      `${environment.apiUrl}/disponibilidad/slots?fecha=${fecha}&tratamiento_id=${this.cita.tratamiento_id}`
    ).subscribe({
      next: data => {
        this.cargandoSlots.set(false);
        if (!data.slots || data.slots.length === 0) {
          this.sinAtencion.set(true);
          this.slots.set([]);
        } else {
          this.sinAtencion.set(false);
          // Solo mostrar slots disponibles
          this.slots.set(data.slots.filter((s: Slot) => s.disponible));
        }
      },
      error: () => {
        this.cargandoSlots.set(false);
        this.error.set('Error al cargar horarios disponibles.');
      }
    });
  }

  elegirHora(slot: Slot) {
    this.selectedTime    = slot.hora;
    this.cita.fecha_hora = slot.fecha_hora.replace(' ', 'T');
  }

  updateTratamientoSeleccionado() {
    this.tratamientoSeleccionado = this.tratamientos().find(t => t.id === this.cita.tratamiento_id);
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
        this.selectedDate            = '';
        this.selectedTime            = '';
        this.tratamientoSeleccionado = undefined;
        this.slots.set([]);
      },
      error: () => {
        this.error.set('Error al agendar la cita. Intenta de nuevo.');
        this.enviando.set(false);
      }
    });
  }
}