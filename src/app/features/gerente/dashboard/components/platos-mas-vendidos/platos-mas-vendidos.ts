import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';

@Component({
  selector: 'app-platos-mas-vendidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './platos-mas-vendidos.html',
  styleUrls: ['./platos-mas-vendidos.css']
})
export class PlatosMasVendidosComponent {
  readonly state = inject(DashboardStateService);

  get recomendacionHtml(): string {
    const texto = this.state.recomendacionTopVentas();
    // Reemplaza la palabra maridajes con una estructura de span anidada
    return texto.replace(
      'maridajes',
      `<span class="tooltip-trigger">maridajes<span class="tooltip-box">El maridaje es la combinación perfecta de una comida y una bebida para resaltar los sabores de ambos.</span></span>`
    );
  }

  porcentajeRanking(valor: number): number {
    const max = Math.max(...this.state.platosMasVendidos().map(item => item.valor));
    if (max === 0) return 0;
    return Math.max(8, Math.round((valor / max) * 100));
  }
}
