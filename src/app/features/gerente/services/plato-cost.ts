import { RecetaIngrediente } from '../../../core/models/domain/plato';

/**
 * Los precios de los insumos siempre están cargados por Kg (o por Litro).
 * Si la receta usa el ingrediente en gramos/mililitros, hay que convertir
 * la cantidad a su equivalente en Kg/Litro antes de multiplicar por el precio.
 */
export function factorConversionAUnidadBase(unidadMedida: string): number {
  const normalizado = unidadMedida.trim().toUpperCase();
  if (['G', 'GR', 'GRAMO', 'GRAMOS', 'ML', 'MILILITRO', 'MILILITROS'].includes(normalizado)) {
    return 1 / 1000;
  }
  return 1;
}

export function calcularCostoReceta(receta: RecetaIngrediente[]): number {
  return receta.reduce((total, ingrediente) => {
    const costoUnitario = ingrediente.costoUnitario ?? 0;
    const unidad = typeof ingrediente.unidadMedida === 'string'
      ? ingrediente.unidadMedida
      : ingrediente.unidadMedida?.nombre ?? '';
    return total + costoUnitario * ingrediente.cantidad * factorConversionAUnidadBase(unidad);
  }, 0);
}

export function redondear100(monto: number): number {
  return Math.round(monto / 100) * 100;
}

export function calcularPrecioConGanancia(costo: number, porcentaje: number): number {
  return redondear100(costo + costo * porcentaje / 100);
}
