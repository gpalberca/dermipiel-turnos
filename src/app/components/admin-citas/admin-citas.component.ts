import { Component, OnInit, signal, computed } from '@angular/core';
import { CitasService, Cita } from '../../services/citas.service';

@Component({
  selector: 'app-admin-citas',
  standalone: true,
  imports: [],
  templateUrl: './admin-citas.component.html',
  styleUrl: './admin-citas.component.css'
})
export class AdminCitasComponent implements OnInit {
  citas = signal<Cita[]>([]);
  cargando = signal(true);
  citasCanceladas = computed(() => this.citas().filter(c => c.estado === 'cancelada').length);

  constructor(private citasService: CitasService) {}

  ngOnInit() {
    this.cargarCitas();
  }

  cargarCitas() {
    this.citasService.getCitas().subscribe({
      next: (data) => {
        this.citas.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  cancelar(id: number) {
    if (confirm('¿Seguro que deseas cancelar esta cita?')) {
      this.citasService.cancelarCita(id).subscribe({
        next: () => this.cargarCitas()
      });
    }
  }

  formatFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-EC', {
      dateStyle: 'medium', timeStyle: 'short'
    });
  }

  getBadgeClass(estado: string): string {
    return estado === 'pendiente' ? 'badge-pendiente' :
           estado === 'cancelada' ? 'badge-cancelada' : 'badge-confirmada';
  }
}
