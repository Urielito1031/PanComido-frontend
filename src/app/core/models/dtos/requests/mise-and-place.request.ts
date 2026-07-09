export interface MiseAndPlaceIngredienteDto {
  ingredienteId: number;
  cantidad: number;
}

export interface CrearMiseAndPlaceDto {
  nombre: string;
  descripcion: string;
  cantidad: number;
  fechaVencimiento: string;
  unidadMedidaId: number;
  categoriaId: number;
  bodegaId: number;
  ingredientes: MiseAndPlaceIngredienteDto[];
}