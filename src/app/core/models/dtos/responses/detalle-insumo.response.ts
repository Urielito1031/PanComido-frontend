export interface DetalleInsumoResponseDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precioVentaFinal?: number;
  esPrecioManual: boolean;
  stockMinimo: number;
  stockRecomendado: number;
  categoriaId: number;
  unidadDeMedidaId: number;
  urlImagen: string | null;
  tipo: string;
}
