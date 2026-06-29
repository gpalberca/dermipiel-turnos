// src/app/components/admin-conversaciones/admin-conversaciones.component.ts
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import {
  ConversacionesService,
  ConversacionResumen,
  ConversacionDetalle
} from '../../services/conversaciones.service';

@Component({
  selector:    'app-admin-conversaciones',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './admin-conversaciones.component.html',
  styleUrls:   ['./admin-conversaciones.component.css']
})
export class AdminConversacionesComponent implements OnInit {
  private svc = inject(ConversacionesService);

  // ── Lista ────────────────────────────────────────────
  conversaciones  = signal<ConversacionResumen[]>([]);
  cargandoLista   = signal(false);
  total           = signal(0);
  pagina          = signal(1);
  paginas         = signal(1);

  // Filtros
  busqueda        = signal('');
  filtroPeriodo   = signal('hoy');
  filtroResultado = signal('');

  // ── Detalle ──────────────────────────────────────────
  seleccionada    = signal<ConversacionResumen | null>(null);
  detalle         = signal<ConversacionDetalle | null>(null);
  cargandoDetalle = signal(false);

  // ── Init ─────────────────────────────────────────────
  ngOnInit(): void { this.cargarLista(); }

  cargarLista(): void {
    this.cargandoLista.set(true);
    this.svc.getConversaciones({
      q:         this.busqueda(),
      periodo:   this.filtroPeriodo(),
      resultado: this.filtroResultado(),
      page:      this.pagina(),
      limit:     30
    }).subscribe({
      next: res => {
        this.conversaciones.set(res.data);
        this.total.set(res.total);
        this.paginas.set(res.pages);
        this.cargandoLista.set(false);
        // Seleccionar primera si no hay seleccionada
        if (!this.seleccionada() && res.data.length) {
          this.seleccionar(res.data[0]);
        }
      },
      error: () => this.cargandoLista.set(false)
    });
  }

  // ── Filtros ───────────────────────────────────────────
  onBusqueda(v: string):   void { this.busqueda.set(v);        this.pagina.set(1); this.cargarLista(); }
  onPeriodo(v: string):    void { this.filtroPeriodo.set(v);   this.pagina.set(1); this.cargarLista(); }
  onResultado(v: string):  void { this.filtroResultado.set(v); this.pagina.set(1); this.cargarLista(); }
  cambiarPagina(p: number):void {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p); this.cargarLista();
  }

  // ── Seleccionar conversación ──────────────────────────
  seleccionar(conv: ConversacionResumen): void {
    this.seleccionada.set(conv);
    this.detalle.set(null);
    this.cargandoDetalle.set(true);
    this.svc.getDetalle(conv.session_id).subscribe({
      next: d => { this.detalle.set(d); this.cargandoDetalle.set(false); },
      error: () => this.cargandoDetalle.set(false)
    });
  }

  // ── Helpers ───────────────────────────────────────────
  nombreDisplay(conv: ConversacionResumen): string {
    return conv.cliente_nombre || conv.nombre_wa || conv.session_id;
  }

  horaCorta(fecha: string): string {
    const d = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(); ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString())
      return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === ayer.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
  }

  duracion(inicio: string, fin: string): string {
    const mins = Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins/60)}h ${mins%60}min`;
  }

  horaCompleta(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  }

  paginasArray(): number[] {
    return Array.from({ length: this.paginas() }, (_, i) => i + 1);
  }
}