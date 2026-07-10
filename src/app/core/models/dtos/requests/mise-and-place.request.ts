export interface MiseAndPlaceIngredienteDto {
  ingredienteId: number;
  cantidad: number;
}

export interface CrearMiseAndPlaceDto {
  nombre: string;
  descripcion: string;
  cantidad: number;
  rendimientoBase: number;
  fechaVencimiento: string;
  unidadMedidaId: number;
  categoriaId: number;
  bodegaId: number;
  ingredientes: MiseAndPlaceIngredienteDto[];
}

export interface ModificarMiseAndPlaceDto {
  loteId: number;
  nombre: string;
  descripcion: string;
  rendimientoBase: number;
  fechaVencimiento: string;
  unidadMedidaId: number;
  categoriaId: number;
  bodegaId: number;
  ingredientes: MiseAndPlaceIngredienteDto[];
}

export interface ProducirMiseAndPlaceDto {
  cantidad: number;
  fechaVencimiento: string;
  bodegaId: number;
}