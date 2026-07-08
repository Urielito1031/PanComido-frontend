import { Plato } from '../../../../core/models/domain/plato';
import { TipoArticuloCarta } from '../../../../core/models/domain/articulo-carta';
import { PorcentajeItem } from '../../../../core/models/domain/porcentajes-ganancia';

export type CartaSortOrder = 'default' | 'ventas-desc' | 'ventas-asc' | 'precio-desc' | 'precio-asc';

export interface TipoCartaDisponible {
  tipo: string;
  count: number;
}

export function esBebidaPreparada(plato: Plato): boolean {
  return plato.tipo === TipoArticuloCarta.BebidaPreparada;
}

export function esBebida(plato: Plato): boolean {
  return esBebidaPreparada(plato)
    || normalizar(plato.categoria).includes('bebida')
    || normalizar(plato.tipo).includes('bebida')
    || !!plato.bebida;
}

// BebidaPreparada no tiene categoriaInsumoId/categoriaPlatoId: su categoría de ganancia es "Con alcohol"/"Sin alcohol".
export function categoriaGananciaBebidaPreparada(plato: Plato, porcentajesBebidas: PorcentajeItem[]): number {
  const categoria = normalizar(plato.categoria);
  return porcentajesBebidas.find(item => normalizar(item.descripcion) === categoria)?.porcentaje ?? 0;
}

export function tipoBebida(plato: Plato): string {
  return plato.categoria?.trim() ?? '';
}

export function tipoComida(plato: Plato): string {
  const tipoFinal = plato.categoria?.trim() || plato.tipo?.trim() || 'Otros';
  return normalizar(tipoFinal) === 'plato principal' ? 'Principal' : tipoFinal;
}

export function tiposDisponibles(platos: Plato[], resolverTipo: (plato: Plato) => string): TipoCartaDisponible[] {
  const tipos = new Map<string, number>();

  for (const plato of platos) {
    const tipo = resolverTipo(plato);
    tipos.set(tipo, (tipos.get(tipo) ?? 0) + 1);
  }

  return [...tipos.entries()]
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => a.tipo.localeCompare(b.tipo));
}

export function ordenarPlatosCarta(
  platos: Plato[],
  sortOrder: CartaSortOrder,
  resolverTipo: (plato: Plato) => string = tipoComida
): Plato[] {
  return [...platos].sort((a, b) => {
    if (sortOrder === 'ventas-desc') return (b.ventas ?? 0) - (a.ventas ?? 0);
    if (sortOrder === 'ventas-asc') return (a.ventas ?? 0) - (b.ventas ?? 0);
    if (sortOrder === 'precio-desc') return (b.precioVenta ?? 0) - (a.precioVenta ?? 0);
    if (sortOrder === 'precio-asc') return (a.precioVenta ?? 0) - (b.precioVenta ?? 0);

    const aVisible = a.visible ?? true;
    const bVisible = b.visible ?? true;
    if (aVisible !== bVisible) return aVisible ? -1 : 1;

    // Orden por defecto ("Por Relevancia"): agrupar por tipo de plato
    const comparacionTipo = resolverTipo(a).localeCompare(resolverTipo(b));
    if (comparacionTipo !== 0) return comparacionTipo;

    if (!aVisible) {
      const aRecomendado = !!a.recomendado;
      const bRecomendado = !!b.recomendado;
      if (aRecomendado && !bRecomendado) return 1;
      if (!aRecomendado && bRecomendado) return -1;
    }

    return 0;
  });
}

export function ordenarPorVisibilidad(platos: Plato[]): Plato[] {
  return [...platos].sort((a, b) => {
    if (a.visible === b.visible) return 0;
    return a.visible ? -1 : 1;
  });
}

function normalizar(valor: string | null | undefined): string {
  return valor?.toLowerCase().trim() ?? '';
}
