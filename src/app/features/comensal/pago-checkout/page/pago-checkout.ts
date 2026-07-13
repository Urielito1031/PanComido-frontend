import { Component, DestroyRef, inject, signal, effect, computed, OnDestroy, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ComandaState } from '../../services/comanda-state';
import { PagoService } from '../../services/pago.service';
import { ComandaHubService } from '../../../../core/services/hubs/comanda/comanda-hub-service';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { ConfiguracionState } from '../../../gerente/configuracion/services/configuracion-state';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { Modal } from '../../../../shared/ui/modal/modal';
import { MetodoPagoId } from '../../../../core/models/domain/metodo-pago';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pago-checkout',
  standalone: true,
  imports: [HeaderComensal, DecimalPipe, BotonComensal, Modal],
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

  configuracionVisualState = inject(ConfiguracionVisualState);
  configuracionState = inject(ConfiguracionState);
  datosTransferencia = this.configuracionState.datosTransferenciaComensal;
  cargandoDatosTransferencia = this.configuracionState.datosTransferenciaComensalCargando;
  campoCopiado = signal<string | null>(null);
  confirmandoTransferencia = signal(false);
  errorTransferencia = signal<string | null>(null);

  estado = this.comandaState.estadoPedido;
  mesaId = this.comandaState.mesaId;
  metodoCargando = signal<'mp' | 'tarjeta' | 'efectivo' | 'transferencia' | null>(null);
  pagoSolicitado = signal(false);
  error = signal<string | null>(null);

  metodosPago = this.configuracionState.metodosPago;

  tieneMercadoPago = computed(() =>
    this.metodosPago().some(m => m.descripcion.toLowerCase().includes('mercado') && m.habilitado)
  );
  tieneTarjeta = computed(() =>
    this.metodosPago().some(m => m.descripcion.toLowerCase() === 'tarjeta' && m.habilitado)
  );
  tieneEfectivo = computed(() =>
    this.metodosPago().some(m => m.descripcion.toLowerCase() === 'efectivo' && m.habilitado)
  );
  tieneTransferencia = computed(() =>
    this.metodosPago().some(m => m.descripcion.toLowerCase() === 'transferencia' && m.habilitado)
  );

  modoSplit = signal<'igual' | 'individual'>('igual');

  itemsAgrupados = computed(() => {
    const items = this.estado()?.items ?? [];
    const grupos = new Map<string, typeof items>();
    for (const item of items) {
      const nombre = item.nombreComensal || 'Sin nombre';
      if (!grupos.has(nombre)) grupos.set(nombre, []);
      grupos.get(nombre)!.push(item);
    }
    return Array.from(grupos.entries()).map(([nombre, items]) => ({ nombre, items }));
  });

  resumenPorComensal = computed(() =>
    this.itemsAgrupados().map(grupo => ({
      nombre: grupo.nombre,
      subtotal: grupo.items.reduce((acc, i) => acc + i.precioUnitario * i.cantidad, 0)
    }))
  );

  cantidadPersonas = computed(() => this.itemsAgrupados().length || 1);

  totalPorPersonaIgual = computed(() =>
    this.estado() ? this.estado()!.totalAPagar / this.cantidadPersonas() : 0
  );

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
        this.metodoCargando.set(null)
      }
    })
  }

  ngOnInit() {
    this.configuracionState.cargarMetodosPago(this.comandaState.restauranteId() ?? undefined);
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
      this.error.set('El pago con Mercado Pago fue rechazado. Elegí otro método');
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
    this.solicitarPagoDirecto(MetodoPagoId.Efectivo, 'efectivo');
  }

  pagarTarjeta(): void {
    this.solicitarPagoDirecto(MetodoPagoId.Tarjeta, 'tarjeta');
  }

  private solicitarPagoDirecto(metodoPago: MetodoPagoId, metodoCargandoValor: 'efectivo' | 'tarjeta'): void {
    const comandaId = this.estado()?.comandaId;
    if (!comandaId || this.pagoSolicitado() || this.metodoCargando()) return;

    this.metodoCargando.set(metodoCargandoValor);
    this.error.set(null);

    const restauranteId = this.comandaState.restauranteId() ?? 1;
    this.pagoService.solicitarPago(comandaId, restauranteId, metodoPago)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.metodoCargando.set(null);
          this.pagoSolicitado.set(true);
          this.router.navigate(['/comensal/pago-confirmado'], { queryParams: { metodo: metodoCargandoValor } });
        },
        error: (err) => {
          this.metodoCargando.set(null);
          this.error.set(err.error?.error || 'Error al solicitar el pago');
        }
      });
  }

  pagarMercadoPago(): void {
    const comandaId = this.estado()?.comandaId;
    if (!comandaId || this.metodoCargando()) return;

    this.metodoCargando.set('mp');
    this.error.set(null);

    const restauranteId = this.comandaState.restauranteId();
    this.pagoService.solicitarPagoMP(comandaId, restauranteId ?? 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.metodoCargando.set(null);
          window.location.href = res.initPoint;
        },
        error: (err) => {
          this.metodoCargando.set(null);
          this.error.set(err.error?.error || 'Error al generar pago');
        }
      });
  }

  pagarTransferencia(modal: Modal): void {
    if (this.pagoSolicitado() || this.metodoCargando()) return;
    const restauranteId = this.comandaState.restauranteId() ?? 1;
    this.errorTransferencia.set(null);
    this.configuracionState.cargarDatosTransferenciaComensal(restauranteId);
    modal.abrir();
  }

  cerrarModalTransferencia(modal: Modal): void {
    modal.cerrar();
  }

  confirmarTransferencia(modal: Modal): void {
    const comandaId = this.estado()?.comandaId;
    if (!comandaId || this.confirmandoTransferencia()) return;

    this.confirmandoTransferencia.set(true);
    this.errorTransferencia.set(null);

    const restauranteId = this.comandaState.restauranteId() ?? 1;
    this.pagoService.solicitarPago(comandaId, restauranteId, MetodoPagoId.Transferencia)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmandoTransferencia.set(false);
          this.pagoSolicitado.set(true);
          modal.cerrar();
          this.router.navigate(['/comensal/pago-confirmado'], { queryParams: { metodo: 'transferencia' } });
        },
        error: (err) => {
          this.confirmandoTransferencia.set(false);
          this.errorTransferencia.set(err.error?.error || 'No se pudo confirmar la transferencia');
        }
      });
  }

  copiarAlPortapapeles(valor: string, campo: string): void {
    navigator.clipboard?.writeText(valor);
    this.campoCopiado.set(campo);
    setTimeout(() => this.campoCopiado.set(null), 1500);
  }
}
