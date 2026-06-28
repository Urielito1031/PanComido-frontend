import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ComandaState } from '../../services/comanda-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { LlamarAlMozo } from '../../components/llamar-al-mozo/llamar-al-mozo';
import { ComensalState } from '../../services/comensal-state';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { ResumenPedido } from '../../components/resumen-pedido/resumen-pedido';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-estado-pedido',
  standalone: true,
  imports: [HeaderComensal, DecimalPipe, BotonComensal, LlamarAlMozo, ResumenPedido],
  templateUrl: './estado-pedido.html',
  styleUrls: ['./estado-pedido.css']
})
export class EstadoPedido implements OnInit, OnDestroy {
  private router = inject(Router);
  private comandaState = inject(ComandaState);
  comensalState = inject(ComensalState);

  configuracionVisualState = inject(ConfiguracionVisualState);
  estado = this.comandaState.estadoPedido;
  mesaId = this.comandaState.mesaId;
  cargando = this.comandaState.cargando;
  error = this.comandaState.error;

  ngOnInit() {
    if (!this.estado()) {
      this.comandaState.consultarEstado();
    }
    const mesaId = this.comandaState.mesaId();
    if (mesaId) {
      this.comandaState.iniciarEscucha(mesaId).catch(err =>
        console.error('Error al conectar hub de comanda:', err)
      );
    }
    console.log('mesaId signal:', this.mesaId());
    console.log('sessionStorage:', sessionStorage.getItem('sesionComensal'));
      console.log('items:', JSON.stringify(this.estado()?.items));
  }

  ngOnDestroy() {
    this.comandaState.detenerEscucha();
  }

  volver(): void {
    this.router.navigate(['/comensal/ver-carta']);
  }

  pagarCuenta(): void {
    this.router.navigate(['/comensal/pago-checkout']);
  }
}
