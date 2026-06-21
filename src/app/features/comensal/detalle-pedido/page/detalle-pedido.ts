import { Component, inject, computed, ViewChild, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { LlamarAlMozo } from '../../components/llamar-al-mozo/llamar-al-mozo';
import { PedidoState } from '../../services/pedido.state';
import { ComandaState } from '../../services/comanda-state';
import { ModalConfirmacionPedido } from '../../components/modal-confirmacion-pedido/modal-confirmacion-pedido';
import { ComensalState } from '../../services/comensal-state';
import { ItemPedido } from '../../../../core/models/domain/item-pedido';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [HeaderComensal, LlamarAlMozo, ModalConfirmacionPedido],
  templateUrl: './detalle-pedido.html',
  styleUrls: ['./detalle-pedido.css']
})
export class DetallePedido implements OnInit {
  private router = inject(Router);
  private pedidoService = inject(PedidoState);
  comandaState = inject(ComandaState);
  comensalState = inject(ComensalState);

  @ViewChild(ModalConfirmacionPedido) modal!: ModalConfirmacionPedido;

  configuracionVisualState = inject(ConfiguracionVisualState);

  ngOnInit(): void {
  }
  
  // Usar el signal del servicio directamente (reactivo)
  pedidos = this.pedidoService.pedidos;

  // Computed para el total
  total = computed(() => {
    const totalCarrito = this.pedidos().reduce(
      (acc, item) => acc + item.plato.precioVentaFinal * item.cantidad,
      0
    );
    const totalConfirmado = this.comandaState.estadoPedido()?.totalAPagar || 0;
    return totalCarrito + totalConfirmado;
  });

  volver(): void {
    this.router.navigate(['/comensal/pedido']);
  }

  confirmarPedido(): void {
    // Validación: debe haber comanda activa
    // if (!this.comandaState.tieneComandaActiva()) {
    //   alert('No hay mesa seleccionada. Por favor, escanea el QR de la mesa.');
    //   return;
    // }
    const comandaId = this.comandaState.comandaId?.();

if (!comandaId) {
  alert('No hay comanda activa. Ingresá o escaneá el QR de la mesa.');
  return;
}

    // Validación: debe haber items en el carrito
    if (this.pedidos().length === 0) {
      alert('El carrito está vacío');
      return;
    }

    // Mostrar modal con confirmación
    this.modal.mostrar();
  }

editarItem(item: ItemPedido): void {
  this.router.navigate(['/comensal/personalizar-plato'], {
    state: {
      plato: item
    }
  });
}
}
