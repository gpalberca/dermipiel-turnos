import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CitasService, Cita } from '../../services/citas.service';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';

@Component({
  selector: 'app-agendar-cita',
  standalone: true,
  imports: [RouterLink, FormsModule],
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

  constructor(
    private citasService: CitasService,
    private tratamientosService: TratamientosService
  ) {}

  ngOnInit() {
    this.tratamientosService.getTratamientos().subscribe({
      next: (data) => this.tratamientos.set(data)
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
      },
      error: (err) => {
        this.error.set('Error al agendar la cita. Intenta de nuevo.');
        this.enviando.set(false);
      }
    });
  }
}
