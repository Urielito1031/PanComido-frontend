export interface ConfirmarPedidoRequest {
  items: ItemPedidoRequest[];
  nombreComensal: string;
}

export interface ItemPedidoRequest {
  articuloId: number;
  cantidad: number;
  idIngredientesPersonalizadosSacados: number[] | null;
  observacionesGenerales: string | null;
}
