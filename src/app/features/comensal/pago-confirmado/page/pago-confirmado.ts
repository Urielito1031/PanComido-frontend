import { Component, inject, ChangeDetectionStrategy, signal} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pago-confirmado',
  standalone: true,
  imports: [],
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

  configuracionVisualState = inject(ConfiguracionVisualState);
  estado = this.comandaState.estadoPedido;
  mesaId = this.comandaState.mesaId;

  ngOnInit() {
    const status = this.route.snapshot.queryParams['status'];

    if (status === 'approved') {
      this.pagoExitoso.set(true);
      this.esEfectivo.set(false);
    } else if (status === 'failure' || (status && status !== 'approved')) {
      this.pagoExitoso.set(false);
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
    this.router.navigate(['/comensal/encuesta']);
  }

  
}
