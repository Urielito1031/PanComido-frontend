export interface InsumoRecetaBebida {
  insumoId: number;
  cantidad: number;
  nombre: string;
}

export interface BebidaPreparada {
  id: number;
  nombre: string;
  descripcion?: string;
  precioVentaFinal: number;
  esPrecioManual: boolean;
  esVisibleEnCarta: boolean;
  urlImagen: string | null;
  categoria: string;
  insumos: InsumoRecetaBebida[];
}
