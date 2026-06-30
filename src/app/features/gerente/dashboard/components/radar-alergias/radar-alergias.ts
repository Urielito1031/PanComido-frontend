import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';

@Component({
  selector: 'app-radar-alergias',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './radar-alergias.html',
  styleUrls: ['./radar-alergias.css']
})
export class RadarAlergiasComponent {
  readonly state = inject(DashboardStateService);

  obtenerTonoTasa(tasa: string): string {
    const valor = parseFloat(tasa.replace('%', ''));
    if (valor >= 40) return 'tasa-badge-critical';
    if (valor >= 20) return 'tasa-badge-medium';
    return 'tasa-badge-low';
  }
}
