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


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detalle-pedido',
  standalone: true,
  imports: [LlamarAlMozo, ModalConfirmacionPedido, DecimalPipe, HeaderComensal],
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

  estadoColor = computed(() => {
    const st = this.comandaState.estadoPedido()?.estadoUI?.toLowerCase() || '';
    if (st.includes('preparaci')) return '#ebd038';
    if (st.includes('listo') || st.includes('hecho') || st.includes('espera')) return '#6bb446';
    return '#a3a3a3';
  });

  estadoTextColor = computed(() => {
    const st = this.comandaState.estadoPedido()?.estadoUI?.toLowerCase() || '';
    if (st.includes('preparaci')) return '#000000';
    return '#ffffff';
  });

  estadoBorder = '#808080';

  // Computed para el total
  total = computed(() => {
    const totalCarrito = this.pedidos().reduce(
      (acc, item) => acc + item.plato.precio * item.cantidad,
      0
    );
    const totalConfirmado = this.comandaState.estadoPedido()?.totalAPagar || 0;
    return totalCarrito + totalConfirmado;
  });



  volver(): void {
    this.router.navigate(['/comensal/pedido']);
  }
  readonly nombreComensalActual = sessionStorage.getItem('nombreComensal') ?? '';

  itemsAgrupados = computed(() => {
    const items = this.comandaState.estadoPedido()?.items ?? [];
    const grupos = new Map<string, typeof items>();
    for (const item of items) {
      const nombre = item.nombreComensal || 'Sin nombre';
      if (!grupos.has(nombre)) grupos.set(nombre, []);
      grupos.get(nombre)!.push(item);
    }
    return Array.from(grupos.entries()).map(([nombre, items]) => ({ nombre, items }));
  });

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
