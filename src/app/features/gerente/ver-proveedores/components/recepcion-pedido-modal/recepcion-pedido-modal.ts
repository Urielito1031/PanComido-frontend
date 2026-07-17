import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark, faTrash } from '@fortawesome/free-solid-svg-icons';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { VerProveedoresState } from '../../services/ver-proveedores.state';

@Component({
  selector: 'app-recepcion-pedido-modal',
  standalone: true,
  imports: [FormsModule, FontAwesomeModule, Boton],
  templateUrl: './recepcion-pedido-modal.html',
  styleUrl: './recepcion-pedido-modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecepcionPedidoModalComponent {
  private readonly state = inject(VerProveedoresState);

  recepcionPedido = this.state.recepcionPedido;
  recepcionItems = this.state.recepcionItems;
  bodegas = this.state.bodegas;

  faXmark = faXmark;
  faTrash = faTrash;

  cerrarRecepcion(): void {
    this.state.cerrarRecepcion();
  }

  actualizarCantidadRecepcion(insumoId: number, value: string | number | null): void {
    const cantidad = Number(value);
    if (Number.isFinite(cantidad)) {
      this.state.actualizarRecepcionItem(insumoId, { cantidad });
    }
  }

  actualizarFechaRecepcion(insumoId: number, fechaVencimiento: string): void {
    this.state.actualizarRecepcionItem(insumoId, { fechaVencimiento });
  }

  actualizarPrecioRecepcion(insumoId: number, value: string | number | null): void {
    const precioUnitario = Number(value);
    if (Number.isFinite(precioUnitario)) {
      this.state.actualizarRecepcionItem(insumoId, { precioUnitario });
    }
  }

  actualizarBodegaRecepcion(insumoId: number, value: string | number): void {
    this.state.actualizarRecepcionItem(insumoId, { bodegaId: Number(value) });
  }

  recibirPedido(): void {
    this.state.recibirPedido();
  }
}
