export interface DetalleBebidaPreparadaResponseDto {
  id: number;
  nombre: string;
  descripcion?: string;
  precioVentaFinal: number;
  urlImagen: string | null;
  esPrecioManual: boolean;
  esVisibleEnCarta: boolean;
  categoria: string;
  insumos: InsumoRecetaBebidaResponseDto[];
}

export interface InsumoRecetaBebidaResponseDto {
  insumoId: number;
  cantidad: number;
  nombre: string;
}
