import { inject, Injectable, signal } from '@angular/core';
import { SignalRConexionService } from '../base-hub-service';
import { Llamado } from '../../../models/domain/llamado';

export interface LlamadosResueltosPayload {
  mesaId: number;
  llamadoIds: number[];
}

@Injectable({
  providedIn: 'root',
})
export class MozoHubService {
  private conexion = inject(SignalRConexionService);
  llamadoRecibido = signal<Llamado | null>(null);
  llamadosResueltosAutomaticamente = signal<LlamadosResueltosPayload | null>(null);

  private readonly handlerLlamadoMozo = (llamado: Llamado) => {
    this.llamadoRecibido.set(llamado);
  };

  private readonly handlerLlamadoCocina = (llamado: Llamado) => {
    this.llamadoRecibido.set(llamado);
  };

  private readonly handlerLlamadosResueltos = (payload: LlamadosResueltosPayload) => {
    this.llamadosResueltosAutomaticamente.set(payload);
  };

  public async conectarYUnirseGrupo(restauranteId:number, mozoId:number): Promise<void> {
    await this.conexion.iniciar();
    await this.conexion.hub.invoke("UnirseMozo", restauranteId, mozoId);

    this.conexion.hub.off('LlamadoMozo', this.handlerLlamadoMozo);
    this.conexion.hub.on('LlamadoMozo', this.handlerLlamadoMozo);

    this.conexion.hub.off('LlamadoCocina', this.handlerLlamadoCocina);
    this.conexion.hub.on('LlamadoCocina', this.handlerLlamadoCocina);

    this.conexion.hub.off('LlamadosResueltosAutomaticamente', this.handlerLlamadosResueltos);
    this.conexion.hub.on('LlamadosResueltosAutomaticamente', this.handlerLlamadosResueltos);
  }

  public desconectarEscucha(): void {
    if (this.conexion.hub) {
      this.conexion.hub.off('LlamadoMozo', this.handlerLlamadoMozo);
      this.conexion.hub.off('LlamadoCocina', this.handlerLlamadoCocina);
      this.conexion.hub.off('LlamadosResueltosAutomaticamente', this.handlerLlamadosResueltos);
    }
  }

  public detener(): void {
    this.conexion.detener();
  }
}