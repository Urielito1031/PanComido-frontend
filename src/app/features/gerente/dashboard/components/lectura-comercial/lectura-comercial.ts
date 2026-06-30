import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';

@Component({
  selector: 'app-lectura-comercial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lectura-comercial.html',
  styleUrls: ['./lectura-comercial.css']
})
export class LecturaComercialComponent {
  index = input<number | null>(null);
  readonly state = inject(DashboardStateService);
}
