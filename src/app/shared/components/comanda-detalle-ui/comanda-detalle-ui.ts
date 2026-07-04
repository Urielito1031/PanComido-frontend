import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Boton } from '../../ui/botones/boton/boton';
import { MetodoPagoId } from '../../../core/models/domain/metodo-pago';

@Component({
  selector: 'app-comanda-detalle-ui',
  standalone: true,
  imports: [CommonModule, Boton],
  templateUrl: './comanda-detalle-ui.html',
  styleUrls: ['./comanda-detalle-ui.css']
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
