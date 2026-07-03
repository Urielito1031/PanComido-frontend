import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Boton } from '../../ui/botones/boton/boton';
import { MetodoPagoId } from '../../../core/models/domain/metodo-pago';

@Component({
  selector: 'app-comanda-detalle-ui',
  standalone: true,
  imports: [CommonModule, Boton],
  template: `
    <div class="comanda-contenedor">
      <div class="d-flex justify-content-between mb-3 align-items-center">
        <h5 class="fw-bold m-0" style="color: #444;">Detalle pedido</h5>
        <button type="button" class="btn-close" (click)="cerrar.emit()"></button>
      </div>

      <div class="d-flex justify-content-between mb-3 gap-3">
        <div class="info-box d-flex align-items-center px-3 py-2 border rounded bg-white w-50">
          <span class="material-symbols-outlined ms-1 me-2 text-dark fs-5">person</span>
          <span class="fw-bold">{{ comensales() }}</span>
        </div>
        <div class="info-box d-flex align-items-center justify-content-center px-3 py-2 border rounded bg-white w-50">
          <span class="text-muted me-1">Nro:</span> <span class="fw-bold">{{ mesa() }}</span>
        </div>
      </div>

      <div class="border rounded bg-white p-3 mb-4 ticket-container" style="max-height: 400px; overflow-y: auto;">
        <table class="table table-borderless m-0 table-sm" style="color: #555;">
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td class="text-start pe-3" style="font-size: 0.95rem;">
                  <span class="fw-medium text-dark">{{ item.cantidad }}</span> {{ item.articulo.nombre }}
                </td>
                <td class="text-end text-nowrap" style="font-size: 0.95rem;">
                  $ {{ (item.articulo.precioVentaFinal || 0) * item.cantidad | number:'1.0-0':'es-AR' }}
                </td>
              </tr>
            }
          </tbody>
          <tfoot class="border-top">
            <tr>
              <td class="fw-bold text-dark pt-3" style="font-size: 1.1rem;">TOTAL</td>
              <td class="fw-bold text-dark text-end pt-3 text-nowrap" style="font-size: 1.1rem;">
                $ {{ total() | number:'1.0-0':'es-AR' }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="d-flex flex-column gap-2 mt-auto">
        <span class="text-muted fw-medium" style="font-size: 0.85rem;">Cobrar pedido con:</span>
        <div class="d-flex gap-2">
          <app-boton label="Efectivo" variante="success" tamanio="sm" class="flex-fill" (clicked)="cobrar.emit(metodoPagoId.Efectivo)" />
          <app-boton label="Tarjeta" variante="primary" tamanio="sm" class="flex-fill" (clicked)="cobrar.emit(metodoPagoId.Tarjeta)" />
          <app-boton label="Transferencia" variante="teal" tamanio="sm" class="flex-fill" (clicked)="cobrar.emit(metodoPagoId.Transferencia)" />
        </div>
        <button type="button" class="btn btn-outline-info w-100 py-2 rounded" (click)="cerrarMesa.emit()">Cerrar mesa</button>
      </div>
    </div>
  `,
  styles: [`
    .comanda-contenedor {
      background-color: #FDF9F1; /* Color base crema */
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .info-box {
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .ticket-container {
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    .btn-outline-info {
      color: #17a2b8;
      border-color: #17a2b8;
      background-color: white;
      font-weight: 500;
    }
    .btn-outline-info:hover {
      background-color: #17a2b8;
      color: white;
    }
  `]
})
export class ComandaDetalleUiComponent {
  comensales = input.required<number>();
  mesa = input.required<number>();
  items = input.required<any[]>();
  total = input.required<number>();

  readonly metodoPagoId = MetodoPagoId;

  cerrar = output<void>();
  cobrar = output<MetodoPagoId>();
  cerrarMesa = output<void>();
}
