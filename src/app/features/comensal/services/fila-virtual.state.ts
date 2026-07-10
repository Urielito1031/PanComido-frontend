import { inject, Injectable, signal, effect } from '@angular/core';
import { FilaVirtualService } from './fila-virtual.service';
import { FilaVirtualHubService } from '../../../core/services/hubs/fila-virtual/fila-virtual-hub.service';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FilaVirtualState {
  private service = inject(FilaVirtualService);
  private hub = inject(FilaVirtualHubService);
  
  readonly #turnoId = signal<number | null>(null);
  readonly #estado = signal<any>(null);
  
  turnoId = this.#turnoId.asReadonly();
  estado = this.#estado.asReadonly();
  mesaListaParaOcupar = this.hub.mesaListaParaOcupar;

  constructor() {
    const savedTurnoId = sessionStorage.getItem('filaVirtualTurnoId');
    const savedEstado = sessionStorage.getItem('filaVirtualEstado');
    
    if (savedTurnoId) this.#turnoId.set(Number(savedTurnoId));
    if (savedEstado) {
      try {
        this.#estado.set(JSON.parse(savedEstado));
      } catch (e) {}
    }

    effect(() => {
      const nuevoEstado = this.hub.estadoFilaActualizado();
      if (nuevoEstado) {
        this.#estado.set(nuevoEstado);
        sessionStorage.setItem('filaVirtualEstado', JSON.stringify(nuevoEstado));
      }
    }, { allowSignalWrites: true });
  }

  anotarse(restauranteId: number, nombre: string, cantidad: number) {
    return this.service.anotarse(restauranteId, { nombreCliente: nombre, cantidadPersonas: cantidad }).pipe(
      tap(res => {
        this.#turnoId.set(res.turnoId);
        this.#estado.set(res);
        sessionStorage.setItem('filaVirtualTurnoId', String(res.turnoId));
        sessionStorage.setItem('filaVirtualEstado', JSON.stringify(res));
      })
    );
  }
  
  iniciarEscucha() {
    if (this.#turnoId()) {
      this.hub.conectarComoEspera(this.#turnoId()!);
    }
  }

  guardarPedidoPreArmado(turnoId: number, pedidos: any[]) {
    return this.service.guardarPedidoPreArmado(turnoId, pedidos);
  }

  setMesaAsignadaDirecta(mesaId: number, minutos: number) {
    this.hub.mesaListaParaOcupar.set({ mesaId: mesaId, minutosParaOcupar: minutos });
  }
}
