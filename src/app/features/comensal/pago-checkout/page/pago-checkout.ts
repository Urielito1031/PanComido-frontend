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
import { take, takeUntil } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pago-checkout',
  standalone: true,
  imports: [HeaderComensal, DecimalPipe, BotonComensal],
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
  private configuracionState = inject(ConfiguracionState);

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
    this.configuracionState.cargarMetodosPago();
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
    if (!comandaId || this.pagoSolicitado() || this.metodoCargando()) return;

    this.metodoCargando.set('efectivo');
    this.error.set(null);

    const restauranteId = this.comandaState.restauranteId() ?? 1;
    this.pagoService.solicitarPagoEfectivo(comandaId, restauranteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.metodoCargando.set(null);
          this.pagoSolicitado.set(true);
          this.router.navigate(['/comensal/pago-confirmado']);
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

  pagarTransferencia(): void {
    // TODO: conectar endpoint cuando el backend esté listo
  }

  pagarTarjeta(): void {
    const comandaId = this.estado()?.comandaId;
    if (!comandaId || this.metodoCargando()) return;

    this.metodoCargando.set('tarjeta');
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
}
