import { Component, inject, OnInit, ChangeDetectionStrategy, computed, effect } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FilaVirtualState } from '../../services/fila-virtual.state';
import { FilaVirtualService } from '../../services/fila-virtual.service';
import { PedidoState } from '../../services/pedido.state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.Default,
  selector: 'app-estado-fila',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './estado-fila.html',
  styleUrls: ['./estado-fila.css']
})
export class EstadoFila implements OnInit {
  private state = inject(FilaVirtualState);
  private router = inject(Router);
  private service = inject(FilaVirtualService);
  pedidoState = inject(PedidoState);
  configVisual = inject(ConfiguracionVisualState);
  
  estado = this.state.estado;
  mostrarModalSalir = false;

  totalPedido = computed(() => {
    return this.pedidoState.pedidos().reduce((acc: number, item: any) => acc + (item.plato.precio * item.cantidad), 0);
  });

  ngOnInit() {
    this.state.iniciarEscucha();
    
    const rId = Number(sessionStorage.getItem('restauranteId'));
    if (rId) {
      this.configVisual.cargar(rId);
    }
  }

  constructor() {
    effect(() => {
      const mesaLista = this.state.mesaListaParaOcupar();
      if (mesaLista) {
        this.router.navigate(['/comensal/mesa-lista']);
      }
    });
  }

  accionPedido() {
    if (this.pedidoState.pedidos().length > 0) {
      this.router.navigate(['/comensal/detalle-pedido']);
    } else {
      this.router.navigate(['/comensal/ver-carta']);
    }
  }

  abrirModalSalir() {
    this.mostrarModalSalir = true;
  }

  cerrarModalSalir() {
    this.mostrarModalSalir = false;
  }

  confirmarSalir() {
    this.mostrarModalSalir = false;
    const id = this.state.turnoId();
    const rId = Number(sessionStorage.getItem('restauranteId')) || 1;
    
    if (id) {
      this.service.cancelarTurno(rId, id).subscribe(() => {
        this.router.navigate(['/comensal/anotarse-fila', rId]);
      });
    } else {
      this.router.navigate(['/comensal/anotarse-fila', rId]);
    }
  }
}
