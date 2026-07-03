import { inject, Injectable, DestroyRef, signal } from '@angular/core';
import { ConfiguracionService } from './configuracion-service';
import { DatosLocal } from '../../../../core/models/domain/datos-local';
import { MetodoPago } from '../../../../core/models/domain/metodo-pago';
import { TurnoLaboral } from '../../../../core/models/domain/turno-laboral';
import { forkJoin, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FamiliaTipografica } from '../../../../core/models/domain/familia-tipografica';
import { FilaVirtual } from '../../../../core/models/domain/fila-virtual';
import { PorcentajesGanancia } from '../../../../core/models/domain/porcentajes-ganancia';
import { DatosTransferencia } from '../../../../core/models/domain/datos-transferencia';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionState {

  private api = inject(ConfiguracionService);
  private destroyRef = inject(DestroyRef);

  readonly #datosLocal = signal<DatosLocal | null>(null);
  readonly #metodosPago = signal<MetodoPago[]>([]);
  readonly #turnos = signal<TurnoLaboral[]>([]);
  readonly #filaVirtual = signal< FilaVirtual | null>(null);
  readonly #porcentajes = signal<PorcentajesGanancia| null>(null);
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
    this.#guardando.set(true);
    this.#error.set(null);
    this.#exito.set(null);
    console.log("Archivo de img: ",archivo)

    forkJoin({
      datosLocal: this.api.actualizarDatosLocal(datosLocal,archivo),
      metodosPago: this.api.actualizarMetodosPago(metodosPago),
      turnos: this.api.actualizarTurnos(turnos),
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
        this.#guardando.set(false);
        this.#exito.set('Configuración guardada correctamente');
      },
      error: () =>{ 
        this.#guardando.set(false);
        this.#error.set("No se pudo guardar la condfiguración. Revisá los datos e intentá nuevamente")
      }
    })
  }

  limpiarFeedback():void{
    this.#error.set(null);
    this.#exito.set(null);
  }



  



}
