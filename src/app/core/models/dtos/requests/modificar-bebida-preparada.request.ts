import { InsumoRecetaBebidaDto } from './crear-bebida-preparada.request';

export interface ModificarBebidaPreparadaRequestDto {
  nombre: string;
  descripcion?: string;
  precioVentaFinal: number;
  esPrecioManual?: boolean;
  esVisibleEnCarta?: boolean;
  insumos: InsumoRecetaBebidaDto[];
}
