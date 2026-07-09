import { Component, inject, computed, ViewChild, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { LlamarAlMozo } from '../../components/llamar-al-mozo/llamar-al-mozo';
import { PedidoState } from '../../services/pedido.state';
import { ComandaState } from '../../services/comanda-state';
import { ModalConfirmacionPedido } from '../../components/modal-confirmacion-pedido/modal-confirmacion-pedido';
import { ComensalState } from '../../services/comensal-state';
import { ItemPedido } from '../../../../core/models/domain/item-pedido';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ResumenPedido } from '../../components/resumen-pedido/resumen-pedido';
import { FilaVirtualState } from '../../services/fila-virtual.state';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [LlamarAlMozo, ModalConfirmacionPedido, DecimalPipe, HeaderComensal, BotonComensal, ResumenPedido],
  templateUrl: './detalle-pedido.html',
  styleUrls: ['./detalle-pedido.css']
})
export class DetallePedido implements OnInit, OnDestroy {
  private router = inject(Router);
  private pedidoService = inject(PedidoState);
  comandaState = inject(ComandaState);
  comensalState = inject(ComensalState);

  @ViewChild(ModalConfirmacionPedido) modal!: ModalConfirmacionPedido;

  configuracionVisualState = inject(ConfiguracionVisualState);
  filaVirtualState = inject(FilaVirtualState);



  // Usar el signal del servicio directamente (reactivo)
  pedidos = this.pedidoService.pedidos;
  mesaId = this.comandaState.mesaId;

  ngOnInit(): void {
    this.comandaState.consultarEstado();
    const mesaId = this.comandaState.mesaId();
    if (mesaId) {
      this.comandaState.iniciarEscucha(mesaId).catch(err =>
        console.error('Error al conectar hub:', err)
      );
    }
  }

  ngOnDestroy(): void {
    this.comandaState.detenerEscucha();
  }

  // Computed para el total
  total = computed(() => {
    const totalCarrito = this.pedidos().reduce(
      (acc, item) => acc + item.plato.precio * item.cantidad,
      0
    );
    const totalConfirmado = this.comandaState.estadoPedido()?.totalAPagar || 0;
    return totalCarrito + totalConfirmado;
  });



  volverACarta() {
    this.router.navigate(['/comensal/ver-carta']);
  }

  volver(): void {
    this.router.navigate(['/comensal/ver-carta']);
  }

  verEstado(): void {
    this.router.navigate(['/comensal/estado-pedido']);
  }
  readonly nombreComensalActual = sessionStorage.getItem('nombreComensal') ?? '';

  confirmarPedido(): void {
    const turnoId = this.filaVirtualState.turnoId();
    
    if (turnoId) {
      if (this.pedidos().length === 0) return;
      this.filaVirtualState.guardarPedidoPreArmado(turnoId, this.pedidos()).subscribe(() => {
        this.router.navigate(['/comensal/estado-fila']);
      });
      return;
    }

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

  editarItem(item: ItemPedido, index: number): void {
    this.router.navigate(['/comensal/personalizar-plato'], {
      state: { plato: item, index }
    });
  }

    eliminarItem(index: number): void {
    this.pedidoService.eliminarPedido(index);
  }

  incrementarCantidad(index: number): void {
    this.pedidoService.incrementarCantidad(index);
  }

  decrementarCantidad(index: number): void {
    this.pedidoService.decrementarCantidad(index);
  }

 
}
