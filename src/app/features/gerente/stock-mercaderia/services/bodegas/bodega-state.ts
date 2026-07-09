import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { TipoBodega } from '../../../../../core/models/domain/tipo-bodega';
import { BodegaService } from './bodega-service';

@Injectable({
  providedIn: 'root',
})
export class BodegaState {

  private api = inject(BodegaService);
  private destroyRef = inject(DestroyRef);

  readonly #tiposBodega = signal<TipoBodega[]>([]);

  readonly #bodegas = signal<Bodega[]>([]);
  readonly #bodegasConInsumosCargadas = signal<boolean>(false);

  readonly errorMensaje = signal<string | null>(null);


  bodegas = this.#bodegas.asReadonly();
  bodegasConInsumosCargadas = this.#bodegasConInsumosCargadas.asReadonly();
  tiposBodega = this.#tiposBodega.asReadonly();

  cargarBodegas(): void {
    this.api.obtenerBodegas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.#bodegas.set(data),

      error: (err) => console.error('Error al cargar bodegas:', err)
    });
  }
  cargarBodegasConInsumos(forzar: boolean = false): void {
    if (this.#bodegasConInsumosCargadas() && !forzar) return;
    this.api.obtenerBodegasConInsumos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.#bodegas.set(data);
        this.#bodegasConInsumosCargadas.set(true);
      },
    });
  }

  cargarTiposBodega(): void {
    if (this.#tiposBodega().length > 0) return;
    this.api.obtenerTiposBodega().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.#tiposBodega.set(data),
      error: (err) => console.error('Error al cargar tipos de bodega:', err)
    });
  }
  readonly errorGuardar = signal<string | null>(null);
  readonly estadoGuardar = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly estadoEliminar = signal<'idle' | 'loading' | 'success' | 'error'>('idle');

  resetEstados(): void {
    this.estadoGuardar.set('idle');
    this.estadoEliminar.set('idle');
    this.errorGuardar.set(null);
    this.errorMensaje.set(null);
  }

  guardarBodega(payload: { id?: number; nombre: string; tipoBodegaId: number }): void {
    this.errorGuardar.set(null);
    this.estadoGuardar.set('loading');
    
    const obs$ = payload.id
      ? this.api.modificarBodega(payload.id, payload)
      : this.api.crearBodega(payload);
      
    obs$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.#bodegasConInsumosCargadas.set(false);
        this.cargarBodegasConInsumos(true);
        this.estadoGuardar.set('success');
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Ya existe una bodega con ese nombre.';
        this.errorGuardar.set(mensaje);
        this.estadoGuardar.set('error');
      }
    });
  }

  eliminarBodega(id: number): void {
    this.errorMensaje.set(null);
    this.estadoEliminar.set('loading');
    
    this.api.eliminarBodega(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.#bodegasConInsumosCargadas.set(false);
        this.cargarBodegasConInsumos(true);
        this.estadoEliminar.set('success');
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || err.error?.detail || err.error?.error || 'No se puede eliminar la bodega porque tiene lotes activos.';
        this.errorMensaje.set(mensaje);
        this.estadoEliminar.set('error');
      }
    });
  }
}
