
export interface IngredienteMiseAndPlaceResponseDto {
  id: number;
  nombre: string;
  unidadMedida: string;
  costoUnitario: number;
}

export interface CategoriaLightDto {
  id: number;
  descripcion: string;
}

export interface BodegaLightDto {
  id: number;
  nombre: string;
}
export interface UnidadMedidaResponseDto {
  id: number;
  nombre: string;
}


export interface DatosFormularioMiseAndPlaceDto {
  ingredientes: IngredienteMiseAndPlaceResponseDto[];
  categorias: CategoriaLightDto[];
  unidadesMedida: UnidadMedidaResponseDto[];
  bodegas: BodegaLightDto[];
}

export interface RecetaItemDto {
  ingredienteId: number;
  nombreIngrediente: string;
  cantidad: number;
  unidadMedida: string;
  costoUnitario: number;
}

export interface MiseAndPlaceListadoDto {
  loteId: number;
  articuloId: number;
  miseAndPlaceId: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
  fechaVencimiento: string | null;
  unidadMedida: string;
  categoria: string;
  bodega: string;
  stockMinimo: number;
  stockRecomendado: number;
  costoUnitario: number;
  costo: number;
  receta: RecetaItemDto[];
}