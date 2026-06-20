import { inject, Injectable, signal } from '@angular/core';
import { Comanda } from '../../../models/domain/comanda';
import { SignalRConexionService } from '../base-hub-service';

@Injectable({
  providedIn: 'root',
})
export class ComandaHubService  {

  private conexion = inject(SignalRConexionService);
  comandaModificada = signal<Comanda | null>(null);

  //eventos de pago

  readonly #pagoRechazado  = signal<Comanda | null>(null);
  pagoRechazado = this.#pagoRechazado.asReadonly();


  public async conectarYUnirseGrupo(restauranteId:number):Promise<void> {
    await this.conexion.iniciar();
    
    await this.conexion.hub.invoke("UnirseCocina", restauranteId);
    this.conexion.hub.off("EstadoComandaModificada");

    this.conexion.hub.on("EstadoComandaModificada", (comanda: Comanda) => {
      this.comandaModificada.set(comanda);
    });
  }

  public async conectarComoMozo(restauranteId: number, mozoId: number): Promise<void> {
    await this.conexion.iniciar();
    await this.conexion.hub.invoke("UnirseMozo", restauranteId, mozoId);
    this.conexion.hub.off("EstadoComandaModificada");
    this.conexion.hub.on("EstadoComandaModificada", (comanda: Comanda) => {
        this.comandaModificada.set(comanda);
    });
  }

  public async conectarComoComensal(mesaId: number): Promise<void> {
    await this.conexion.iniciar();
    await this.conexion.hub.invoke("UnirseMesa", mesaId);
    
    this.conexion.hub.off("EstadoComandaModificada");
    this.conexion.hub.off("ComandaActualizada");
    this.conexion.hub.off("PagoRechazado");

    this.conexion.hub.on("EstadoComandaModificada", (comanda: Comanda) => {
        this.comandaModificada.set(comanda);
    });

    //pago MP confirmado
    this.conexion.hub.on("ComandaActualizada",(comanda : Comanda) => {
      this.comandaModificada.set(comanda);
    })
    //pago MP rechazado 
    this.conexion.hub.on("PagoRechazado", (comanda: Comanda)=>{
      this.#pagoRechazado.set(comanda);
    })
  }
  
  public detener():void{
    this.conexion.detener();
  }

  /** Remueve solo el listener de EsteComandaModificada — NO detiene el hub compartido */
  public desconectarEscucha(): void {
    this.conexion.hub.off("EstadoComandaModificada");
    this.conexion.hub.off("ComandaActualizada");
    this.conexion.hub.off("PagoRechazado");
  }
 
}
