import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';

@Component({
  selector: 'app-platos-menos-vendidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './platos-menos-vendidos.html',
  styleUrls: ['./platos-menos-vendidos.css']
})
export class PlatosMenosVendidosComponent {
  readonly state = inject(DashboardStateService);
  readonly mostrandoCriterios = signal<boolean>(false);

  alternarExplicacionCriterios(event: Event): void {
    event.stopPropagation();
    this.mostrandoCriterios.update(v => !v);
  }

  abrirDetallePlato(plato: any, index: number): void {
    this.state.abrirDetallePlato(plato, index);
  }
}
