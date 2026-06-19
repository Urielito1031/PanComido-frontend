import { Component, inject , ChangeDetectionStrategy, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ComandaState } from '../../services/comanda-state';
import { configuracionRestauranteMock } from '../../../../infra/mocks/configuracion-restaurante.mock-data';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pago-confirmado',
  standalone: true,
  imports: [DecimalPipe, BotonComensal],
  templateUrl: './pago-confirmado.html',
  styleUrls: ['./pago-confirmado.css']
})
export class PagoConfirmado {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private comandaState = inject(ComandaState);

  esEfectivo = signal(false);
  pagoExitoso = signal(true);
  error = signal(false);

  configuracion = configuracionRestauranteMock;
  estado = this.comandaState.estadoPedido;
  mesaId = this.comandaState.mesaId;

  ngOnInit() {
    const status = this.route.snapshot.queryParams['status'];

    if (status === 'approved') {
      this.pagoExitoso.set(true);
      this.esEfectivo.set(false);
    } else if (status === 'failure' || (status && status !== 'approved')) {
      this.error.set(true);
    } else {
      // si no tiene query params viene de efectivo
      this.pagoExitoso.set(true);
      this.esEfectivo.set(true);
    }
  }


  volverInicio(): void {
    this.comandaState.limpiarEstado();
    this.router.navigate(['/comensal/escanear-mesa']);
  }

  puntuarPlatos(): void {
    console.warn('puntuarPlatos no implementado aún');
  }
}
