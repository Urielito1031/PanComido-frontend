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

  porcentajeRanking(valor: number): number {
    const max = Math.max(...this.state.platosMasVendidos().map(item => item.valor));
    if (max === 0) return 0;
    return Math.max(8, Math.round((valor / max) * 100));
  }
}
