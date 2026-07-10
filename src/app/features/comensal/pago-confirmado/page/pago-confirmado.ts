import { Component, inject, ChangeDetectionStrategy, signal, effect} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ComandaHubService } from '../../../../core/services/hubs/comanda/comanda-hub-service';
import { EstadoComandaId } from '../../../../core/models/domain/comanda';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pago-confirmado',
  standalone: true,
  imports: [BotonComensal],
  templateUrl: './pago-confirmado.html',
  styleUrls: ['./pago-confirmado.css']
})
export class PagoConfirmado {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private comandaState = inject(ComandaState);
  private comandaHub = inject(ComandaHubService);

  metodoPago = signal<'efectivo' | 'tarjeta' | 'transferencia' | null>(null);
  pagoExitoso = signal(true);
  error = signal(false);

  configuracionVisualState = inject(ConfiguracionVisualState);
  estado = this.comandaState.estadoPedido;
  mesaId = this.comandaState.mesaId;

  constructor(){
    effect(()=> {
      const modificada = this.comandaHub.comandaModificada();
      if(modificada){
        if(Number(modificada.estado)=== EstadoComandaId.Finalizada){

          this.comandaState.consultarEstado();
        } 
      }
    });
  }

  ngOnInit() {
    const status = this.route.snapshot.queryParams['status'];
    const metodo = this.route.snapshot.queryParams['metodo'];

    if (status === 'approved') {
      // pago con Mercado Pago ya confirmado: se puede calificar directamente
      this.router.navigate(['/comensal/encuesta']);
      return;
    } else if (status === 'failure' || (status && status !== 'approved')) {
      this.pagoExitoso.set(false);
      this.error.set(true);
    } else {
      // efectivo, tarjeta o transferencia: falta la confirmación del mozo
      this.pagoExitoso.set(true);
      this.metodoPago.set(metodo === 'tarjeta' || metodo === 'transferencia' ? metodo : 'efectivo');
    }
    const mesaId = this.comandaState.mesaId();
    if(mesaId){
      this.comandaHub.conectarComoComensal(mesaId);
    }
  }

  esperandoConfirmacion(): boolean {
    return this.metodoPago() !== null && this.estado()?.estadoUI !== 'Finalizada';
  }

  mensajeEspera(): string {
    switch (this.metodoPago()) {
      case 'tarjeta':
        return 'Se acercará a la brevedad a tu mesa para realizar el cobro con tarjeta.';
      case 'transferencia':
        return 'Confirmará la recepción de tu transferencia a la brevedad.';
      default:
        return 'Se acercará a la brevedad a tu mesa para realizar el cobro en efectivo.';
    }
  }
  ngOnDestroy(){
    this.comandaHub.desconectarEscucha();
  }

  volverInicio(): void {
    this.comandaState.limpiarEstado();
    this.router.navigate(['/comensal/escanear-mesa']);
  }

  puntuarPlatos(): void {
    this.router.navigate(['/comensal/encuesta']);
  }

  
}
