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
  readonly paginaActual = signal<number>(1);
  readonly itemsPorPagina = 6;

  readonly insumosFiltrados = computed(() => {
    const todos = this.state.insumosPorVencer();
    const filtro = this.filtroCriticidadVencimiento();
    if (filtro === 'todos') {
      return todos;
    }
    return todos.filter(item => item.criticidad.toLowerCase() === filtro);
  });

  readonly totalPaginas = computed(() => {
    return Math.max(1, Math.ceil(this.insumosFiltrados().length / this.itemsPorPagina));
  });

  readonly insumosPaginados = computed(() => {
    const inicio = (this.paginaActual() - 1) * this.itemsPorPagina;
    return this.insumosFiltrados().slice(inicio, inicio + this.itemsPorPagina);
  });

  readonly primerItemVisible = computed(() => {
    if (this.insumosFiltrados().length === 0) return 0;
    return ((this.paginaActual() - 1) * this.itemsPorPagina) + 1;
  });

  readonly ultimoItemVisible = computed(() => {
    return Math.min(this.paginaActual() * this.itemsPorPagina, this.insumosFiltrados().length);
  });

  establecerFiltroCriticidad(filtro: 'todos' | 'alta' | 'media' | 'baja'): void {
    this.filtroCriticidadVencimiento.set(filtro);
    this.paginaActual.set(1);
  }

  irAPagina(pagina: number): void {
    const siguiente = Math.min(Math.max(1, pagina), this.totalPaginas());
    this.paginaActual.set(siguiente);
  }
}
