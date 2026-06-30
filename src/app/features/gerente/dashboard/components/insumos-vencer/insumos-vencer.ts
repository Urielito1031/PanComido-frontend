import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';

@Component({
  selector: 'app-insumos-vencer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insumos-vencer.html',
  styleUrls: ['./insumos-vencer.css']
})
export class InsumosVencerComponent {
  readonly state = inject(DashboardStateService);
  readonly filtroCriticidadVencimiento = signal<'todos' | 'alta' | 'media' | 'baja'>('todos');

  readonly insumosFiltrados = computed(() => {
    const todos = this.state.insumosPorVencer();
    const filtro = this.filtroCriticidadVencimiento();
    if (filtro === 'todos') {
      return todos;
    }
    return todos.filter(item => item.criticidad.toLowerCase() === filtro);
  });

  establecerFiltroCriticidad(filtro: 'todos' | 'alta' | 'media' | 'baja'): void {
    this.filtroCriticidadVencimiento.set(filtro);
  }
}
