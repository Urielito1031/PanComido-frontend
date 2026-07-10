import { UnidadMedida } from './unidad-medida';
import { CategoriaInsumo } from './categoria-insumo';

export interface Insumo {
  id: number;
  nombre: string;
  stockActual: number;
  vencimiento: string;
  unidadMedida: UnidadMedida;
  categoriaIngrediente: CategoriaInsumo;
  stockMinimo: number;
  precioVentaFinal?: number;
  esPrecioManual: boolean;
  esVisibleEnCarta: boolean;
  costo: number;
}

export interface InsumoDetalle {
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
  esVisibleEnCarta: boolean;
  costo: number;
}

export interface LoteInsumo {
  id: number;
  nombre: string;
  insumoId: number;
  cantidad: number;
  fechaVencimiento: string | null;
  bodegaId: number;
}
