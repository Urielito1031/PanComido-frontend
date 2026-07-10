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

  metodoPago = signal<'efectivo' | 'tarjeta' | 'transferencia' | 'mercadopago' | null>(null);
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
    effect(() => {
      const rechazado = this.comandaHub.pagoRechazado();
      if (rechazado) {
        this.router.navigate(['/comensal/pago-checkout'], { queryParams: { error: 'mp' } });
      }
    });
  }

  ngOnInit() {
    let statusParam = this.route.snapshot.queryParams['status'];
    let metodoParam = this.route.snapshot.queryParams['metodo'];

    const status = Array.isArray(statusParam) ? statusParam[0] : statusParam;
    const metodo = Array.isArray(metodoParam) ? metodoParam[0] : metodoParam;

    if (status === 'approved') {
      // MP redirige apenas termina el checkout, pero la confirmación real llega por webhook al backend
      this.pagoExitoso.set(true);
      this.metodoPago.set('mercadopago');
      this.comandaState.consultarEstado();
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
      case 'mercadopago':
        return 'Estamos confirmando tu pago con Mercado Pago, esto puede tardar unos segundos.';
      default:
        return 'Se acercará a la brevedad a tu mesa para realizar el cobro en efectivo.';
    }
  }

  tituloEspera(): string {
    return this.metodoPago() === 'mercadopago' ? 'Confirmando tu pago...' : '¡El mozo fue notificado!';
  }

  subtituloConfirmacionPendiente(): string {
    return this.metodoPago() === 'mercadopago'
      ? 'Podrás calificar tu experiencia en cuanto se confirme el pago.'
      : 'Podrás calificar tu experiencia una vez que el pago sea confirmado por el mozo.';
  }
  ngOnDestroy(){
    this.comandaHub.desconectarEscucha();
  }

  volverInicio(): void {
    this.comandaState.limpiarEstado();
    this.router.navigate(['/comensal/escanear']);
  }

  puntuarPlatos(): void {
    this.router.navigate(['/comensal/encuesta']);
  }

  
}
