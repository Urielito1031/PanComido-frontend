export interface ModificarInsumoRequestDto {
  nombre: string;
  descripcion?: string;
  precioVentaFinal?: number;
  esPrecioManual: boolean;
  stockMinimo: number;
  stockRecomendado: number;
  categoriaId: number;
  unidadDeMedidaId: number;
}
