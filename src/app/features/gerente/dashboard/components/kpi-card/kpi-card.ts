import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, ArsCurrencyPipe],
  templateUrl: './kpi-card.html',
  styleUrls: ['./kpi-card.css']
})
export class KpiCardComponent {
  type = input.required<'ventas' | 'pedidos' | 'ticket' | 'promedio'>();
  readonly state = inject(DashboardStateService);
}
