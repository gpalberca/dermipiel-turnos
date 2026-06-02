import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';

const ETIQUETAS: Record<string, { texto: string; clase: string }> = {
  'depilacion': { texto: 'Más solicitado', clase: 'pill-popular' },
  'láser co': { texto: 'Sin anestesia', clase: 'pill-info' },
  'laser co': { texto: 'Sin anestesia', clase: 'pill-info' },
  'hydrafacial': { texto: 'Premium', clase: 'pill-premium' },
  'despigmentacion': { texto: 'Especializado', clase: 'pill-especial' },
  'despigmentación': { texto: 'Especializado', clase: 'pill-especial' },
};

const FALLBACK_IMGS: string[] = [
  'https://dermipiel.ec/wp-content/uploads/2026/05/WhatsApp-Image-2026-05-16-at-3.40.56-PM-1.jpeg',
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80',
  'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80',
  'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80',
];

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit {
  tratamientos = signal<Tratamiento[]>([]);
  cargando = signal(true);

  constructor(private tratamientosService: TratamientosService) {}

  ngOnInit() {
    this.tratamientosService.getTratamientos().subscribe({
      next: (data) => {
        this.tratamientos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.cargando.set(false);
      }
    });
  }

  getPill(t: Tratamiento): { texto: string; clase: string } | null {
    if (t.etiqueta) return { texto: t.etiqueta, clase: 'pill-popular' };
    const nombre = t.nombre.toLowerCase();
    for (const key of Object.keys(ETIQUETAS)) {
      if (nombre.includes(key)) return ETIQUETAS[key];
    }
    return null;
  }

  getImagen(t: Tratamiento, index: number): string {
    return t.imagen_url || FALLBACK_IMGS[index % FALLBACK_IMGS.length];
  }
}
