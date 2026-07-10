import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { MesaOcuparResponse } from '../../../core/models/dtos/responses/mesa-ocupar.response';
import { ComandaClienteResponse } from '../../../core/models/dtos/responses/comanda-cliente.response';
import { ConfirmarPedidoRequest, ItemPedidoRequest } from '../../../core/models/dtos/requests/confirmar-pedido.request';
import { ItemPedido } from '../../../core/models/domain/item-pedido';

@Injectable({ providedIn: 'root' })
export class ComandaService {
  private api = inject(ApiService);

  /**
   * POST /mesa/comensal/{restauranteId}/{mesaId}/ocupar
   * Body: { cantidadComensales: number }
   */
  ocuparMesa(
    restauranteId: number,
    mesaId: number,
    cantidadComensales: number,
    nombreComensal: string,
    turnoId?: number
  ): Observable<MesaOcuparResponse> {

    return this.api.post<MesaOcuparResponse>(
      `mesa/comensal/${restauranteId}/${mesaId}/ocupar`,
      {
        cantidadComensales,
        nombreComensal,
        turnoId
      }
    );
}

  /**
   * Confirmar pedido con items del carrito
   * POST /comanda/{comandaId}/comensal/{restauranteId}/confirmar-pedido
   */
  confirmarPedido(
  comandaId: number,
  restauranteId: number,
  items: ItemPedido[],
  nombreComensal: string
): Observable<ComandaClienteResponse> {
  const request: ConfirmarPedidoRequest = {
    nombreComensal,
    items: items.map(i => ({
      articuloId: i.plato.id,
      cantidad: i.cantidad,
      observacionesGenerales: i.observacionesGenerales ?? null,
      idIngredientesPersonalizadosSacados: i.observacionesIngredientes ?? null
    }))
  };

  return this.api.post<ComandaClienteResponse>(
    `comanda/${comandaId}/comensal/${restauranteId}/confirmar-pedido`,
    request
  );
}

  /**
   * Consultar estado actual del pedido
   * GET /comanda/{comandaId}/comensal/{restauranteId}/estado-pedido
   */
  obtenerEstado(comandaId: number, restauranteId: number): Observable<ComandaClienteResponse> {
    return this.api.get<ComandaClienteResponse>(
      `comanda/${comandaId}/comensal/${restauranteId}/estado-pedido`
    );
  }

  
//    #aRequestConfirmarPedido(item: ItemPedido): ItemPedidoRequest {
//   return {
//     articuloId: item.plato.id,
//     cantidad: item.cantidad,
//     observacionesGenerales: item.observacionesGenerales ?? null,
//     idIngredientesPersonalizadosSacados: item.observacionesIngredientes ?? null,
//   };
// }
  
  
  
}
