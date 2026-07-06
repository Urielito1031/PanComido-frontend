export interface CrearPlatoRequestDto {
  nombre: string;
  descripcion: string;
  precioVentaFinal: number;
  tiempoPreparacionBase: number;
  esPrecioManual: boolean;
  tipoPlatoId: number;
  categoriaPlatoId: number;
  restriccionesIds: number[];
  ingredientes: CrearPlatoIngredienteDto[];
}

export interface CrearPlatoIngredienteDto {
  insumoId: number;
  cantidad: number;
  opcional: boolean;
}
