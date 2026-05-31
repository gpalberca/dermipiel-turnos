import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TratamientosService, Tratamiento } from '../../services/tratamientos.service';

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
}
