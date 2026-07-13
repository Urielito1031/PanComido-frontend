import { inject, Injectable, DestroyRef, signal, computed } from '@angular/core';
import { ConfiguracionService } from './configuracion-service';
import { DatosLocal } from '../../../../core/models/domain/datos-local';
import { MetodoPago } from '../../../../core/models/domain/metodo-pago';
import { TurnoLaboral } from '../../../../core/models/domain/turno-laboral';
import { forkJoin, of, catchError, throwError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FamiliaTipografica } from '../../../../core/models/domain/familia-tipografica';
import { FilaVirtual } from '../../../../core/models/domain/fila-virtual';
import { PorcentajesGanancia } from '../../../../core/models/domain/porcentajes-ganancia';
import { DatosTransferencia, esDatosTransferenciaValidos } from '../../../../core/models/domain/datos-transferencia';
import { PlatoApiService } from '../../services/plato.api';
import { calcularPrecioConGanancia } from '../../services/plato-cost';
import { esBebida } from '../../modificar-carta/services/modificar-carta.rules';
import { StockMercaderiaService } from '../../stock-mercaderia/services/insumos/stock-mercaderia-service';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionState {

  private api = inject(ConfiguracionService);
  private platoApi = inject(PlatoApiService);
  private stockService = inject(StockMercaderiaService);
  private destroyRef = inject(DestroyRef);

  readonly #datosLocal = signal<DatosLocal | null>(null);
  readonly #metodosPago = signal<MetodoPago[]>([]);
  readonly #turnos = signal<TurnoLaboral[]>([]);
  readonly #filaVirtual = signal< FilaVirtual | null>(null);
  readonly #porcentajes = signal<PorcentajesGanancia| null>(null);
  readonly #porcentajesOriginal = signal<PorcentajesGanancia | null>(null);
  readonly #familiasTipograficas = signal<FamiliaTipografica[]>([]);
  readonly #archivoLogoPendiente = signal<File | null> (null);
  readonly #datosTransferencia = signal<DatosTransferencia | null>(null);
  readonly #datosTransferenciaComensal = signal<DatosTransferencia | null>(null);
  readonly #datosTransferenciaComensalCargando = signal(false);
  readonly #datosTransferenciaComensalCargada = signal(false);
 
  readonly #loading = signal(false);
  readonly #guardando = signal(false);

  readonly #error = signal<string | null>(null);
  readonly #exito = signal<string | null>(null);

  readonly datosLocal = this.#datosLocal.asReadonly();
  readonly metodosPago = this.#metodosPago.asReadonly();
  readonly turnos = this.#turnos.asReadonly();
  readonly filaVirtual = this.#filaVirtual.asReadonly();
  readonly porcentajes = this.#porcentajes.asReadonly();
  readonly familiasTipograficas = this.#familiasTipograficas.asReadonly();
  readonly datosTransferencia = this.#datosTransferencia.asReadonly();
  readonly datosTransferenciaComensal = this.#datosTransferenciaComensal.asReadonly();
  readonly datosTransferenciaComensalCargando = this.#datosTransferenciaComensalCargando.asReadonly();
  readonly datosTransferenciaComensalCargada = this.#datosTransferenciaComensalCargada.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly guardando = this.#guardando.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly exito = this.#exito.asReadonly();

  readonly datosTransferenciaValidos = computed(() => {
    const datos = this.#datosTransferencia();
    return !!datos && esDatosTransferenciaValidos(datos);
  });

  cargarMetodosPago(restauranteId?: number): void {
    if (this.#metodosPago().length > 0) return;
    this.api.obtenerMetodosPago(restauranteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (metodos) => this.#metodosPago.set(metodos),
        error: () => {}
      });
  }

  cargarDatosTransferenciaComensal(restauranteId: number): void {
    if (this.#datosTransferenciaComensalCargada()) return;
    this.#datosTransferenciaComensalCargando.set(true);
    this.api.obtenerDatosTransferenciaComensal(restauranteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (datos) => {
          this.#datosTransferenciaComensal.set(datos);
          this.#datosTransferenciaComensalCargando.set(false);
          this.#datosTransferenciaComensalCargada.set(true);
        },
        error: () => {
          this.#datosTransferenciaComensal.set(null);
          this.#datosTransferenciaComensalCargando.set(false);
          this.#datosTransferenciaComensalCargada.set(true);
        }
      });
  }

  cargarDatos():void{
    this.#loading.set(true);
    this.#error.set(null);
    this.#exito.set(null);

    forkJoin({
      datosLocal: this.api.obtenerDatosLocal(),
      metodosPago: this.api.obtenerMetodosPago(),
      turnos: this.api.obtenerTurnos(),
      fTipograficas: this.api.obtenerFamiliasTipograficas(),
      filaVirtual: this.api.obtenerFilaVirtual(),
      porcentajes: this.api.obtenerPorcentajes(),
      datosTransferencia: this.api.obtenerDatosTransferencia(),
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: ({datosLocal, metodosPago, turnos, fTipograficas, filaVirtual,porcentajes, datosTransferencia}) => {
        this.#datosLocal.set(datosLocal);
        this.#metodosPago.set(metodosPago);
        this.#turnos.set(turnos);
        this.#filaVirtual.set(filaVirtual);
        this.#porcentajes.set(porcentajes);
        this.#porcentajesOriginal.set(porcentajes);
        this.#familiasTipograficas.set(fTipograficas);
        this.#datosTransferencia.set(datosTransferencia);
        this.#loading.set(false);

      },
      error:() => { 
        this.#loading.set(false);
        this.#error.set('No se pueden cargar los datos de configuración');
      }
    })
  }

    actualizarDatosLocal(cambios: Partial<DatosLocal>):void{
      this.#datosLocal.update((actual)=>
        actual ? {...actual,...cambios}: null
      )
    }
    toggleMetodoPago(id:number):void{
      this.#metodosPago.update((lista)=>
        lista.map((m) =>
          m.id=== id ? {...m,habilitado:!m.habilitado}: m
    ))
   }
  actualizarTurno(id:number, 
    cambios: Partial<Pick<
    TurnoLaboral,
    'horarioInicio'|
    'horarioFin'|
    'esNocturno'>>):void{
      this.#turnos.update((lista) =>
      lista.map((t) => (t.id === id ? {...t,...cambios}: t))
    );
  }
  setArchivoLogo(file: File | null): void {
    this.#archivoLogoPendiente.set(file);
    }

    toggleFilaVirtual():void{ 
      this.#filaVirtual.update((actual=> 
        actual? {...actual,habilitada:!actual.habilitada} :null)
      )
    }
    actualizarPorcentajeItem(tipo:'platos' | 'bebidas',id:number,porcentaje:number): void{

      this.#porcentajes.update((actual => {
        if(!actual) return null;
        const items = actual[tipo].map((item) =>
          item.id === id? {...item,porcentaje}:item
        );
        return {...actual,[tipo]:items};
      }))
    }

    actualizarDatosTransferencia(cambios: Partial<DatosTransferencia>): void {
      this.#datosTransferencia.update((actual) => ({
        alias: actual?.alias ?? '',
        cbu: actual?.cbu ?? null,
        numeroCuenta: actual?.numeroCuenta ?? '',
        titularCuenta: actual?.titularCuenta ?? '',
        ...cambios,
      }));
    }

  guardarTodo(): void{
    const datosLocal = this.#datosLocal();
    const archivo = this.#archivoLogoPendiente();
    const metodosPago = this.#metodosPago();
    const turnos = this.#turnos();
    const filaVirtual =this.#filaVirtual();
    const porcentajes = this.#porcentajes();
    const datosTransferencia = this.#datosTransferencia();
    if(!datosLocal || !filaVirtual || !porcentajes){
      this.#error.set('No hay datos para guardar. Cargá la página nuevamente');
      return;
    }
    if (!this.datosTransferenciaValidos()) {
      this.#error.set('Completá los datos de transferencia (alias, número de cuenta y titular) antes de guardar.');
      return;
    }
    this.#guardando.set(true);
    this.#error.set(null);
    this.#exito.set(null);
    console.log("Archivo de img: ",archivo)

    forkJoin({
      datosLocal: this.api.actualizarDatosLocal(datosLocal,archivo),
      metodosPago: this.api.actualizarMetodosPago(metodosPago),
      turnos: this.api.actualizarTurnos(turnos).pipe(
        catchError((err) => {
          if (err.status === 409) {
            return throwError(() => ({
              ...err,
              mensajeTurno: err.error?.error || err.error?.mensaje || 'No se pudo actualizar el horario: el turno tiene un cierre de caja pendiente.'
            }));
          }
          return throwError(() => err);
        })
      ),
      filaVirtual: this.api.actualizarFilaVirtual(filaVirtual),
      porcentajes: this.api.actualizarPorcentajes(porcentajes),
      datosTransferencia: datosTransferencia ? this.api.actualizarDatosTransferencia(datosTransferencia) : of(null),

    }).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (resultado) => {
        if(resultado.datosLocal){
          this.#datosLocal.set(resultado.datosLocal);
        }
        if(resultado.datosTransferencia){
          this.#datosTransferencia.set(resultado.datosTransferencia);
        }

        this.detectarCategoriasPlatosModificadas(porcentajes)
          .forEach(({ categoriaId, porcentaje }) => this.recalcularPreciosDeCategoria(categoriaId, porcentaje));
        this.detectarCategoriasBebidasModificadas(porcentajes)
          .forEach(({ categoriaId, porcentaje }) => this.recalcularPreciosBebidaDeCategoria(categoriaId, porcentaje));
        this.#porcentajesOriginal.set(porcentajes);

        this.#guardando.set(false);
        this.#exito.set('Configuración guardada correctamente');
      },
      error: (err: any) =>{
        this.#guardando.set(false);
        this.#error.set(err?.mensajeTurno ?? "No se pudo guardar la configuración. Revisá los datos e intentá nuevamente")
      }
    })
  }

  private detectarCategoriasPlatosModificadas(nuevo: PorcentajesGanancia): { categoriaId: number; porcentaje: number }[] {
    const original = this.#porcentajesOriginal();
    if (!original) return [];

    return nuevo.platos
      .filter(item => original.platos.find(o => o.id === item.id)?.porcentaje !== item.porcentaje)
      .map(item => ({ categoriaId: item.id, porcentaje: item.porcentaje }));
  }

  private recalcularPreciosDeCategoria(categoriaId: number, porcentaje: number): void {
    this.platoApi.getPlatos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (platos) => {
          const afectados = platos.filter(p => p.categoriaPlatoId === categoriaId && !p.esPrecioManual);
          afectados.forEach(plato => {
            this.platoApi.recalcularPrecioAutomatico(plato.id, porcentaje)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe();
          });
        }
      });
  }

  private detectarCategoriasBebidasModificadas(nuevo: PorcentajesGanancia): { categoriaId: number; porcentaje: number }[] {
    const original = this.#porcentajesOriginal();
    if (!original) return [];

    return nuevo.bebidas
      .filter(item => original.bebidas.find(o => o.id === item.id)?.porcentaje !== item.porcentaje)
      .map(item => ({ categoriaId: item.id, porcentaje: item.porcentaje }));
  }

  private recalcularPreciosBebidaDeCategoria(categoriaId: number, porcentaje: number): void {
    this.platoApi.getPlatos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (articulos) => {
          const afectadas = articulos.filter(a => esBebida(a) && a.categoriaInsumoId === categoriaId && !a.esPrecioManual);
          afectadas.forEach(bebida => {
            this.stockService.getById(bebida.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(detalle => {
                const request = {
                  nombre: detalle.nombre,
                  descripcion: detalle.descripcion ?? undefined,
                  precioVentaFinal: calcularPrecioConGanancia(bebida.costo, porcentaje),
                  esPrecioManual: false,
                  stockMinimo: detalle.stockMinimo,
                  stockRecomendado: detalle.stockRecomendado,
                  categoriaId: detalle.categoriaId,
                  unidadDeMedidaId: detalle.unidadDeMedidaId
                };
                this.stockService.actualizarInsumoConImagen(bebida.id, request)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe();
              });
          });
        }
      });
  }

  limpiarFeedback():void{
    this.#error.set(null);
    this.#exito.set(null);
  }



  



}
