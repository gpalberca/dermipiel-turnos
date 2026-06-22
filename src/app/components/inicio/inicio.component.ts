import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  tratamientos     = signal<Tratamiento[]>([]);
  cargando         = signal(true);
  busqueda         = signal('');
  categoriaActiva  = signal<string>('todas');
  paginaActual     = signal(1);
  porPagina        = 6;

  categorias = computed(() => {
    const cats = this.tratamientos()
      .map(t => t.categoria)
      .filter((c): c is string => !!c);
    return ['todas', ...new Set(cats)];
  });

  tratamientosFiltrados = computed(() => {
    let lista = this.tratamientos();
    const q   = this.busqueda().toLowerCase().trim();
    if (this.categoriaActiva() !== 'todas') {
      lista = lista.filter(t => t.categoria === this.categoriaActiva());
    }
    if (q) {
      lista = lista.filter(t =>
        t.nombre.toLowerCase().includes(q) ||
        t.descripcion?.toLowerCase().includes(q)
      );
    }
    return lista;
  });

  totalPaginas = computed(() =>
    Math.ceil(this.tratamientosFiltrados().length / this.porPagina)
  );

  tratamientosPagina = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.porPagina;
    return this.tratamientosFiltrados().slice(inicio, inicio + this.porPagina);
  });

  paginas = computed(() =>
    Array.from({ length: this.totalPaginas() }, (_, i) => i + 1)
  );

  constructor(private tratamientosService: TratamientosService) {}

  ngOnInit() {
    this.tratamientosService.getTratamientos().subscribe({
      next:  data => { this.tratamientos.set(data); this.cargando.set(false); },
      error: ()   => this.cargando.set(false)
    });
  }

  setCategoria(cat: string) {
    this.categoriaActiva.set(cat);
    this.paginaActual.set(1);
  }

  onBusqueda(q: string) {
    this.busqueda.set(q);
    this.paginaActual.set(1);
  }

  irPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas()) {
      this.paginaActual.set(p);
      document.getElementById('tratamientos')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  getImagen(t: Tratamiento, i: number): string {
    if (t.imagen_url) return t.imagen_url;
    return 'https://dermipiel.ec/wp-content/uploads/2026/05/WhatsApp-Image-2026-05-16-at-3.40.56-PM-1.jpeg';
  }

  getPill(t: Tratamiento): { texto: string; clase: string } | null {
    if (!t.categoria) return null;
    return { texto: t.categoria, clase: 'dp-pill-default' };
  }
  irATratamientos() {
  document.getElementById('tratamientos')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
}