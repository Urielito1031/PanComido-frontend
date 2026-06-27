import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Mesa, EstadoMesa } from '../../../core/models/domain/mesa';
import { MesaOcuparResponse } from '../../../core/models/dtos/responses/mesa-ocupar.response';
import { ApiService } from '../../../core/services/api-service';

@Injectable({ providedIn: 'root' })
export class MesaService {

  private api = inject(ApiService);
  private endpoint = 'mesa';

  getMesas(): Observable<Mesa[]> {
    return this.api.get<Mesa[]>(this.endpoint);
  }

  ocuparMesa(mesaId: number, cantidadComensales: number): Observable<MesaOcuparResponse> {
    return this.api.post<MesaOcuparResponse>(`${this.endpoint}/${mesaId}/ocupar`, { cantidadComensales });
  }

  reservarMesa(mesaId: number): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${mesaId}/reservar`, {});
  }

  guardarMapa(mesas: Mesa[]): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/mapa`, mesas);
  }

  cambiarEstado(mesaId: number, estadoMesa: EstadoMesa): Observable<Mesa> {
    return this.api.patch<Mesa>(`${this.endpoint}/${mesaId}/estado`, { estadoMesa });
  }

  getMozos(): Observable<{id: number, nombre: string}[]> {
    return this.api.get<{id: number, nombre: string}[]>(`${this.endpoint}/mozos`);
  }

  asignarMozos(mesaId: number, mozosIds: number[]): Observable<void> {
    return this.api.post<void>(`${this.endpoint}/${mesaId}/mozos`, mozosIds);
  }

  getComandaActivaPorMesa(mesaId: number): Observable<any> {
    return this.api.get<any>(`comanda/mesa/${mesaId}/activa`);
  }

  confirmarPagoEfectivo(comandaId: number): Observable<void> {
    return this.api.post<void>(`pago/confirmar-pago-efectivo/${comandaId}`, {});
  }
}