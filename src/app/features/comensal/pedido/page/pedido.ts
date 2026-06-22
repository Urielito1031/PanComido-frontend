import { Component, inject, computed, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { ItemPedido } from '../../../../core/models/domain/item-pedido';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import {Boton} from '../../../../shared/ui/botones/boton/boton';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { LlamarAlMozo } from '../../components/llamar-al-mozo/llamar-al-mozo';
import { ComensalState } from '../../services/comensal-state';
import { ComandaState } from '../../services/comanda-state';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pedido',
  standalone: true,
  imports: [HeaderComensal, BotonComensal, Boton, LlamarAlMozo],
  templateUrl: './pedido.html'
})
export class Pedido implements OnInit {
  private router = inject(Router);
  private pedidoService = inject(PedidoState);
  comensalState = inject(ComensalState);
  comandaState = inject(ComandaState);

  // Usar el signal del servicio directamente (reactivo)
  pedidos = this.pedidoService.pedidos;
  configuracionVisualState = inject(ConfiguracionVisualState);

  ngOnInit(): void {
  }

  // Computed para el total
  total = computed(() => {
    return this.pedidos().reduce(
      (acc, item) => acc + item.plato.precio * item.cantidad,
      0
    );
  });

  irADetallePedido(): void {
    this.router.navigate(['/comensal/detalle-pedido']);
  }


  volver(): void {
  const restauranteId = this.comandaState.restauranteId();
  const mesaId = this.comandaState.mesaId();

  this.router.navigate([
    '/comensal/ver-carta',
    restauranteId,
    mesaId,
    1
  ]);
}

  eliminarPedido(index: number): void {
    this.pedidoService.eliminarPedido(index);
  }

  irAPersonalizar(item: ItemPedido, index: number): void {
    this.router.navigate(['/comensal/personalizar-plato'], {
      state: { plato: item, index }
    });
  }

  agregarAlPedido(index: number): void {
  this.pedidoService.incrementarCantidad(index);
}

eliminarUno(index: number): void {
  this.pedidoService.decrementarCantidad(index);
}
}
