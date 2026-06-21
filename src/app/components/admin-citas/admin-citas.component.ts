import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CitasService, Cita } from '../../services/citas.service';

@Component({
  selector: 'app-admin-citas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-citas.component.html',
  styleUrl: './admin-citas.component.css'
})
export class AdminCitasComponent implements OnInit {
  citas      = signal<Cita[]>([]);
  cargando   = signal(true);
  vista      = signal<'lista' | 'semana' | 'mes'>('lista');
  semanaBase = signal(new Date());

  citasPendientes  = computed(() => this.citas().filter(c => c.estado === 'pendiente').length);
  citasConfirmadas = computed(() => this.citas().filter(c => c.estado === 'confirmada').length);
  citasCompletadas = computed(() => this.citas().filter(c => c.estado === 'completada').length);
  citasCanceladas  = computed(() => this.citas().filter(c => c.estado === 'cancelada').length);

  // Horas de atención
  horas = Array.from({ length: 19 }, (_, i) => {
    const h = 9 + Math.floor(i / 2);
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  }); // 09:00 → 18:00

  diasSemana = computed(() => {
    const base  = new Date(this.semanaBase());
    const lunes = new Date(base);
    lunes.setDate(base.getDate() - ((base.getDay() + 6) % 7));
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      return d;
    });
  });

  diasMes = computed(() => {
    const base    = new Date(this.semanaBase());
    const primero = new Date(base.getFullYear(), base.getMonth(), 1);
    const ultimo  = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const dias: (Date | null)[] = [];
    const offset = (primero.getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) dias.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) {
      dias.push(new Date(base.getFullYear(), base.getMonth(), d));
    }
    return dias;
  });

  tituloNavegacion = computed(() => {
    const base = this.semanaBase();
    if (this.vista() === 'mes') {
      return base.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
    }
    const dias = this.diasSemana();
    const ini  = dias[0].toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
    const fin  = dias[5].toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${ini} — ${fin}`;
  });

  constructor(private citasService: CitasService) {}

  ngOnInit() { this.cargarCitas(); }

  cargarCitas() {
    this.citasService.getCitas().subscribe({
      next:  (data) => { this.citas.set(data); this.cargando.set(false); },
      error: ()     => this.cargando.set(false)
    });
  }

  // Navegación
  anterior() {
    const d = new Date(this.semanaBase());
    this.vista() === 'mes' ? d.setMonth(d.getMonth() - 1) : d.setDate(d.getDate() - 7);
    this.semanaBase.set(d);
  }
  siguiente() {
    const d = new Date(this.semanaBase());
    this.vista() === 'mes' ? d.setMonth(d.getMonth() + 1) : d.setDate(d.getDate() + 7);
    this.semanaBase.set(d);
  }
  hoy() { this.semanaBase.set(new Date()); }

  // Citas por slot
 citasEnSlot(dia: Date, hora: string): Cita[] {
  return this.citas().filter(c => {
    const f = this.parseFechaLocal(c.fecha_hora);
    const horaF = `${f.getHours().toString().padStart(2,'0')}:${f.getMinutes().toString().padStart(2,'0')}`;
    return f.toDateString() === dia.toDateString() && horaF === hora;
  });
}

citasEnDia(dia: Date | null): Cita[] {
  if (!dia) return [];
  return this.citas().filter(c =>
    this.parseFechaLocal(c.fecha_hora).toDateString() === dia.toDateString()
  );
}

  esHoy(dia: Date | null): boolean {
    if (!dia) return false;
    return dia.toDateString() === new Date().toDateString();
  }

  // Acciones
  confirmar(id: number) {
    if (confirm('¿Confirmar esta cita?'))
      this.citasService.confirmarCita(id).subscribe({ next: () => this.cargarCitas() });
  }
  completar(id: number) {
    if (confirm('¿Marcar como completada?'))
      this.citasService.completarCita(id).subscribe({ next: () => this.cargarCitas() });
  }
  cancelar(id: number) {
    if (confirm('¿Cancelar esta cita?'))
      this.citasService.cancelarCita(id).subscribe({ next: () => this.cargarCitas() });
  }

 // Convierte "2026-06-25 10:00:00" a Date sin conversión de zona horaria
private parseFechaLocal(fecha: string): Date {
  // Reemplaza el espacio por T y agrega timezone local explícita
  return new Date(fecha.replace(' ', 'T'));
}

formatFecha(fecha: string): string {
  return this.parseFechaLocal(fecha).toLocaleString('es-EC', {
    dateStyle: 'medium', timeStyle: 'short'
  });
}

formatHora(fecha: string): string {
  return this.parseFechaLocal(fecha).toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}
  nombreDia(dia: Date): string {
    return dia.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' });
  }
}