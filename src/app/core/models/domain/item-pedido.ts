import { CartaItem } from './carta-item';

export interface ItemPedido {
  plato: CartaItem;
  cantidad: number;
  observacionesIngredientes?: number[] | null;
  ingredientesRemovidosNombres?: string[];
  observacionesGenerales?: string;
}
