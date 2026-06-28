// src/app/components/admin-clientes/admin-clientes.component.ts
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import { ClientesService, Cliente } from '../../services/clientes.service';

@Component({
  selector:    'app-admin-clientes',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './admin-clientes.component.html',
  styleUrls:   ['./admin-clientes.component.css']
})
export class AdminClientesComponent implements OnInit {
  private svc = inject(ClientesService);

  // ── Estado ──────────────────────────────────────────
  clientes  = signal<Cliente[]>([]);
  cargando  = signal(false);
  total     = signal(0);
  pagina    = signal(1);
  paginas   = signal(1);

  // Filtros
  busqueda  = signal('');
  filtroFuente = signal('');
  filtroActivo = signal('');

  // Modal
  modalAbierto  = signal(false);
  clienteEditar = signal<Partial<Cliente> | null>(null);
  esNuevo       = signal(false);
  guardando     = signal(false);

  // Form fields
  formNombre   = '';
  formTelefono = '';
  formEmail    = '';
  formFuente: 'web' | 'whatsapp' | 'manual' = 'manual';
  formNotas    = '';

  // ── Stats computadas ─────────────────────────────────
  totalActivos    = computed(() => this.clientes().filter(c => c.activo).length);
  totalWhatsapp   = computed(() => this.clientes().filter(c => c.fuente === 'whatsapp').length);
  totalWeb        = computed(() => this.clientes().filter(c => c.fuente === 'web').length);

  // ── Init ─────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargando.set(true);
    this.svc.getClientes({
      q:      this.busqueda(),
      fuente: this.filtroFuente(),
      activo: this.filtroActivo(),
      page:   this.pagina(),
      limit:  20
    }).subscribe({
      next: res => {
        this.clientes.set(res.data);
        this.total.set(res.total);
        this.paginas.set(res.pages);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  // ── Filtros ───────────────────────────────────────────
  onBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
    this.cargarClientes();
  }

  onFiltroFuente(valor: string): void {
    this.filtroFuente.set(valor);
    this.pagina.set(1);
    this.cargarClientes();
  }

  onFiltroActivo(valor: string): void {
    this.filtroActivo.set(valor);
    this.pagina.set(1);
    this.cargarClientes();
  }

  cambiarPagina(p: number): void {
    if (p < 1 || p > this.paginas()) return;
    this.pagina.set(p);
    this.cargarClientes();
  }

  // ── Modal ─────────────────────────────────────────────
  abrirNuevo(): void {
    this.esNuevo.set(true);
    this.clienteEditar.set(null);
    this.limpiarForm();
    this.modalAbierto.set(true);
  }

  abrirEditar(c: Cliente): void {
    this.esNuevo.set(false);
    this.clienteEditar.set(c);
    this.formNombre   = c.nombre;
    this.formTelefono = c.telefono;
    this.formEmail    = c.email    ?? '';
    this.formFuente   = c.fuente;
    this.formNotas    = c.notas    ?? '';
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    this.limpiarForm();
  }

  limpiarForm(): void {
    this.formNombre   = '';
    this.formTelefono = '';
    this.formEmail    = '';
    this.formFuente   = 'manual';
    this.formNotas    = '';
  }

  guardar(): void {
    if (!this.formNombre || !this.formTelefono) return;
    this.guardando.set(true);

    const payload: Partial<Cliente> = {
      nombre:   this.formNombre,
      telefono: this.formTelefono,
      email:    this.formEmail   || null,
      fuente:   this.formFuente,
      notas:    this.formNotas   || null
    };

    if (this.esNuevo()) {
      this.svc.crearCliente(payload).subscribe({
        next: () => { this.cerrarModal(); this.cargarClientes(); this.guardando.set(false); },
        error: () => this.guardando.set(false)
      });
    } else {
      this.svc.editarCliente(this.clienteEditar()!.id!, payload).subscribe({
        next: () => { this.cerrarModal(); this.cargarClientes(); this.guardando.set(false); },
        error: () => this.guardando.set(false)
      });
    }
  }

  // ── Toggle activo ─────────────────────────────────────
  toggleActivo(c: Cliente, event: Event): void {
    event.stopPropagation();
    this.svc.toggleActivo(c.id).subscribe({
      next: res => {
        this.clientes.update(list =>
          list.map(x => x.id === c.id ? { ...x, activo: res.activo } : x)
        );
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────
  iniciales(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  }

  paginasArray(): number[] {
    return Array.from({ length: this.paginas() }, (_, i) => i + 1);
  }
}