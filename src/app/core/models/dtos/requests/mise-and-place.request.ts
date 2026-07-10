export interface MiseAndPlaceIngredienteDto {
  ingredienteId: number;
  cantidad: number;
}

export interface CrearMiseAndPlaceDto {
  nombre: string;
  descripcion: string;
  unidadMedidaId: number;
  categoriaId: number;
  stockMinimo: number;
  stockRecomendado: number;
  ingredientes: MiseAndPlaceIngredienteDto[];
}

export interface ModificarMiseAndPlaceDto {
  nombre: string;
  descripcion: string;
  unidadMedidaId: number;
  categoriaId: number;
  stockMinimo: number;
  stockRecomendado: number;
  ingredientes: MiseAndPlaceIngredienteDto[];
}

export interface ProducirMiseAndPlaceDto {
  cantidad: number;
  fechaVencimiento: string;
  bodegaId: number;
}