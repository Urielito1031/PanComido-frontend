import { RecetaIngrediente } from '../../../core/models/domain/plato';

export function calcularCostoReceta(receta: RecetaIngrediente[]): number {
  return receta.reduce((total, ingrediente) => {
    const costoUnitario = ingrediente.costoUnitario ?? 0;
    return total + costoUnitario * ingrediente.cantidad;
  }, 0);
}

export function redondear100(monto: number): number {
  return Math.round(monto / 100) * 100;
}

export function calcularPrecioConGanancia(costo: number, porcentaje: number): number {
  return redondear100(costo + costo * porcentaje / 100);
}
