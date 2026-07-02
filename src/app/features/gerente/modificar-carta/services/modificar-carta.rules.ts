import { Plato } from '../../../../core/models/domain/plato';

export type CartaSortOrder = 'default' | 'ventas-desc' | 'ventas-asc' | 'precio-desc' | 'precio-asc';

export interface TipoCartaDisponible {
  tipo: string;
  count: number;
}

export function esBebida(plato: Plato): boolean {
  return normalizar(plato.categoria).includes('bebida')
    || normalizar(plato.tipo).includes('bebida')
    || !!plato.bebida;
}

export function tipoBebida(plato: Plato): string {
  const tipo = plato.tipo?.trim();
  const tipoNormalizado = normalizar(tipo);

  if (tipo && tipoNormalizado !== 'bebida' && tipoNormalizado !== 'bebidas') {
    return tipo;
  }

  const nombre = normalizar(plato.nombre);
  if (nombre.includes('cerveza')) return 'Cerveza';
  if (nombre.includes('vino')) return 'Vino';
  if (nombre.includes('agua')) return 'Agua';
  if (nombre.includes('jugo') || nombre.includes('exprimido')) return 'Jugo';
  if (nombre.includes('coca-cola') || nombre.includes('sprite') || nombre.includes('fanta') || nombre.includes('pepsi') || nombre.includes('gaseosa')) {
    return 'Gaseosa';
  }

  return 'Otros';
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

export function ordenarPlatosCarta(platos: Plato[], sortOrder: CartaSortOrder): Plato[] {
  return [...platos].sort((a, b) => {
    if (sortOrder === 'ventas-desc') return (b.ventas ?? 0) - (a.ventas ?? 0);
    if (sortOrder === 'ventas-asc') return (a.ventas ?? 0) - (b.ventas ?? 0);
    if (sortOrder === 'precio-desc') return (b.precioVenta ?? 0) - (a.precioVenta ?? 0);
    if (sortOrder === 'precio-asc') return (a.precioVenta ?? 0) - (b.precioVenta ?? 0);

    const aVisible = a.visible ?? true;
    const bVisible = b.visible ?? true;
    if (aVisible !== bVisible) return aVisible ? -1 : 1;

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
