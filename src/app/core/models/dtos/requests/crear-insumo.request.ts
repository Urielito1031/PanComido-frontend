export interface CrearInsumoRequest {
  nombre: string;
  descripcion?: string;
  precioVentaFinal?: number;
  esPrecioManual: boolean;
  stockMinimo: number;
  stockRecomendado: number;
  categoriaId: number;
  unidadDeMedidaId: number;
  cantidadInicial: number;
  bodegaId: number;
  fechaVencimiento: string;
}
