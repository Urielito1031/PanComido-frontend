import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { EstadoMesa, Mesa, MesaOcupar } from '../../../core/models/domain/mesa';
import { MesaService } from '../services/mesa.service';
import { SignalRConexionService } from '../../../core/services/hubs/base-hub-service';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class MesaLecturaState {
    private api = inject(MesaService);
    private destroyRef = inject(DestroyRef);
    private signalR = inject(SignalRConexionService);
    private auth = inject(AuthService);

    constructor() {
       this.conectarHub();
    }

    private async conectarHub() {
       try {
         await this.signalR.iniciar();
         
         const rol = this.auth.rol();
         const restauranteId = this.auth.restauranteId;
         if (rol === 'Gerente') {
            await this.signalR.hub.invoke('UnirseGerente', restauranteId);
         } else if (rol === 'Mozo' || rol === 'Mozo,Cocina') {
            await this.signalR.hub.invoke('UnirseMozos', restauranteId);
         }
         this.signalR.hub.on('MesaActualizada', (mesa: Mesa) => {
            this.updateMesas(mesas => {
               const idx = mesas.findIndex(m => m.id === mesa.id);
               if (idx > -1) {
                  const newMesas = [...mesas];
                  newMesas[idx] = mesa;
                  return newMesas;
               }
               return [...mesas, mesa];
            });
         });
       } catch (err) {
         console.error('Error conectando SignalR en mesas:', err);
       }
    }

  readonly #mesas = signal<Mesa[]>([]);
  readonly #loading = signal<boolean>(false);
  readonly #mesaSeleccionada = signal<number | null>(null);
  readonly #notificacion = signal<{ mensaje: string; tipo: 'exito' | 'error' | 'info' } | null>(null);

  mesas = this.#mesas.asReadonly();
  loading = this.#loading.asReadonly();
  mesaSeleccionada = this.#mesaSeleccionada.asReadonly();
  notificacion = this.#notificacion.asReadonly();

  // Métodos de mutación seguros para evitar bypass de TypeScript
  setMesas(mesas: Mesa[]): void {
    this.#mesas.set(mesas);
  }

  updateMesas(updater: (mesas: Mesa[]) => Mesa[]): void {
    this.#mesas.update(updater);
  }

  mesasDisponibles = computed(() =>
    this.#mesas().filter(m => m.estadoMesa === EstadoMesa.Disponible && m.tipoElemento !== 2)
  );

  mesasOcupadas = computed(() =>
    this.#mesas().filter(m => m.estadoMesa === EstadoMesa.Ocupada && m.tipoElemento !== 2)
  );

  cargarMesas(): void {
    this.#loading.set(true);
    this.api.getMesas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { this.#mesas.set(data); this.#loading.set(false); },
      error: () => this.#loading.set(false)
    });
  }

  seleccionarMesa(id: number | null): void {
    this.#mesaSeleccionada.update(actual => actual === id ? null : id);
  }
  ocuparMesa(mesaId: number, cantidadComensales: number): Observable<MesaOcupar> {
    return this.api.ocuparMesa(mesaId, cantidadComensales).pipe(
      tap((response: MesaOcupar) => {
        this.#mesas.update(mesas => mesas.map(m => m.id === mesaId ? response.mesa : m));
        this.#mesaSeleccionada.set(null);
        this.mostrarNotificacion('Mesa ocupada exitosamente', 'exito');
      }),
      catchError(err => {
        this.mostrarNotificacion('Error al ocupar la mesa', 'error');
        return throwError(() => err);
      }),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  cambiarEstadoMesa(id: number, nuevoEstado: EstadoMesa): void {
    this.api.cambiarEstado(id, nuevoEstado).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (mesaActualizada: Mesa) => {
        this.#mesas.update(mesas =>
          mesas.map(m => m.id === id ? mesaActualizada : m)
        );
        this.#mesaSeleccionada.set(null);
        this.mostrarNotificacion(
          `Mesa ${nuevoEstado === EstadoMesa.Ocupada ? 'ocupada' : 'actualizada'}`,
          'exito'
        );
      },
      error: (err) => {
        const mensaje = err.error?.error || 'Error al cambiar el estado de la mesa';
        this.mostrarNotificacion(mensaje, 'error');
      }
    });
  }

  mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' | 'info'): void {
    this.#notificacion.set({ mensaje, tipo });
    setTimeout(() => this.#notificacion.set(null), 3000);
  }
}
