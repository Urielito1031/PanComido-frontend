import { Component, DestroyRef, inject, signal, effect, OnDestroy, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ComandaState } from '../../services/comanda-state';
import { PagoService } from '../../services/pago.service';
import { ComandaHubService } from '../../../../core/services/hubs/comanda/comanda-hub-service';
import { configuracionRestauranteMock } from '../../../../infra/mocks/configuracion-restaurante.mock-data';
import { take, takeUntil } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pago-checkout',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './pago-checkout.html',
  styleUrls: ['./pago-checkout.css']
})
export class PagoCheckout implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private comandaState = inject(ComandaState);
  private pagoService = inject(PagoService);
  private comandaHub = inject(ComandaHubService);
  private destroyRef = inject(DestroyRef);

  configuracion = configuracionRestauranteMock;
  estado = this.comandaState.estadoPedido;
  mesaId = this.comandaState.mesaId;
  cargandoPago = signal(false);
  pagoSolicitado = signal(false);
  error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const modificada = this.comandaHub.comandaModificada();
      if (modificada) {
        if (modificada.estado === 'Finalizada') {
          this.router.navigate(['/comensal/pago-confirmado']);
        }
      }
    });
    effect(()=>{
      const comanda = this.comandaHub.pagoRechazado();
      if(comanda){
        this.error.set("El pago fue rechazado. Intenta de nuevo.")
        this.cargandoPago.set(false)
      }
    })
  }

  ngOnInit() {
    if (!this.estado()) {
      this.comandaState.consultarEstado();
    }
    const mesaId = this.comandaState.mesaId();
    if (mesaId) {
      this.comandaHub.conectarComoComensal(mesaId).catch(err =>
        console.error('Error al conectar hub de comanda:', err)
      );
    }

    //para leer query params de MP
    const errorMp = this.route.snapshot.queryParams['error'];
    const pendingMp = this.route.snapshot.queryParams['pending'];

    if(errorMp === 'mp'){
      this.error.set('El pago con Mercado Pago fue rechazado. Elegi otro método');
    }else if(pendingMp === 'mp'){
      this.error.set('El pago está pendiente. Esperá unos segundos y recargá');
    }
  }

  ngOnDestroy() {
    this.comandaHub.desconectarEscucha();
  }

  volver(): void {
    if (this.pagoSolicitado()) return;
    this.router.navigate(['/comensal/estado-pedido']);
  }

  pagarEfectivo(): void {
    const comandaId = this.estado()?.comandaId;
    if (!comandaId || this.pagoSolicitado()) return;

    this.cargandoPago.set(true);
    this.error.set(null);

    const restauranteId = this.comandaState.restauranteId() ?? 1;
    this.pagoService.solicitarPagoEfectivo(comandaId, restauranteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.cargandoPago.set(false);
        this.pagoSolicitado.set(true);
        //ver si es necesario un estado de pendiente a que el mozo confirme el pago en su vista
        this.router.navigate(['/comensal/pago-confirmado']);
      },
      error: (err) => {
        this.cargandoPago.set(false);
        this.error.set(err.error?.error || 'Error al solicitar el pago');
      }
    });
  }

  pagarMercadoPago(): void {
    const comandaId = this.estado()?.comandaId;
    if(!comandaId  || this.cargandoPago()) return;
    
    this.cargandoPago.set(true);
    this.error.set(null);

    const restauranteId = this.comandaState.restauranteId();
    this.pagoService.solicitarPagoMP(comandaId,restauranteId??1)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next:(res) => {
        this.cargandoPago.set(false);
        
        window.location.href = res.initPoint;
      },
      error: (err)=> { 
        this.cargandoPago.set(false);
        this.error.set(err.error?.error || 'Error al generar pago');
      }
    })


  }
}
