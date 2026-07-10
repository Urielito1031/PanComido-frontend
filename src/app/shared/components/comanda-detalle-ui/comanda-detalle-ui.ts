import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Boton } from '../../ui/botones/boton/boton';
import { MetodoPagoId } from '../../../core/models/domain/metodo-pago';
import { AuthService } from '../../../core/services/auth.service';

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
  private authService = inject(AuthService);
  esGerente = this.authService.rol() === 'Gerente';

  cerrar = output<void>();
  cobrar = output<MetodoPagoId>();
  cerrarMesa = output<void>();
  verCarta = output<void>();
}
