import { inject, Injectable, signal } from '@angular/core';
import { SignalRConexionService } from '../base-hub-service';

@Injectable({ providedIn: 'root' })
export class FilaVirtualHubService {
  private conexion = inject(SignalRConexionService);
  estadoFilaActualizado = signal<any>(null);
  mesaListaParaOcupar = signal<{ mesaId: number, minutosParaOcupar: number } | null>(null);
  turnoExpirado = signal<string | null>(null);

  async conectarComoEspera(turnoId: number): Promise<void> {
    await this.conexion.iniciar();
    await this.conexion.hub.invoke("UnirseTurnoFila", turnoId);

    this.conexion.hub.off("EstadoFilaActualizado");
    this.conexion.hub.off("MesaListaParaOcupar");
    this.conexion.hub.off("TurnoExpirado");

    this.conexion.hub.on("EstadoFilaActualizado", (estado: any) => this.estadoFilaActualizado.set(estado));
    this.conexion.hub.on("MesaListaParaOcupar", (data: any) => this.mesaListaParaOcupar.set(data));
    this.conexion.hub.on("TurnoExpirado", (msg: string) => this.turnoExpirado.set(msg));
  }
}
