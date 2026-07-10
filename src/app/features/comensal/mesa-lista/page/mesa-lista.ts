import { Component, inject, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { Router } from '@angular/router';
import { FilaVirtualState } from '../../services/fila-virtual.state';
import { PedidoState } from '../../services/pedido.state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mesa-lista',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mesa-lista.html',
  styleUrls: ['./mesa-lista.css']
})
export class MesaLista {
  private router = inject(Router);
  state = inject(FilaVirtualState);
  pedidoState = inject(PedidoState);
  configVisual = inject(ConfiguracionVisualState);

  mesaAsignada = this.state.mesaListaParaOcupar;
  estadoFila = this.state.estado;

  totalPedido = computed(() => {
    return this.pedidoState.pedidos().reduce((acc, item) => acc + (item.plato.precio * item.cantidad), 0);
  });

  mostrarModalSalir = false;

  escanearQR() {
    this.router.navigate(['/comensal/escanear-mesa']);
  }

  salir() {
    this.mostrarModalSalir = true;
  }

  cerrarModalSalir() {
    this.mostrarModalSalir = false;
  }

  confirmarSalir() {
    this.mostrarModalSalir = false;
    this.router.navigate(['/comensal/anotarse-fila/1']);
  }

  constructor() {
    effect(() => {
      const msg = this.state.turnoExpirado();
      if (msg) {
        alert("Turno Expirado\n\n" + msg);
        sessionStorage.removeItem('filaVirtualTurnoId');
        sessionStorage.removeItem('filaVirtualEstado');
        this.state.turnoExpirado.set(null); // limpiar
        this.router.navigate(['/comensal/anotarse-fila/1']);
      }
    });
  }
}
