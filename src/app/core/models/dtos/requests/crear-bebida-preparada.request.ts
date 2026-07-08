export interface CrearBebidaPreparadaRequestDto {
  nombre: string;
  descripcion?: string;
  precioVentaFinal: number;
  esPrecioManual?: boolean;
  esVisibleEnCarta?: boolean;
  insumos: InsumoRecetaBebidaDto[];
}

export interface InsumoRecetaBebidaDto {
  insumoId: number;
  cantidad: number;
}
