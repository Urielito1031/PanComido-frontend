import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';

@Component({
  selector: 'app-mozos',
  standalone: true,
  imports: [CommonModule, ArsCurrencyPipe],
  templateUrl: './mozos.html',
  styleUrls: ['./mozos.css']
})
export class MozosComponent {
  readonly state = inject(DashboardStateService);
}
