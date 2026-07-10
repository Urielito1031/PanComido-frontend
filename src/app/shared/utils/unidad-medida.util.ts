import { UnidadMedida } from '../../core/models/domain/unidad-medida';

export function normalizarUnidadMedida(unidad: string | UnidadMedida | null | undefined, preferirUnidadesPequenas = false): string {
  const valor = typeof unidad === 'string' ? unidad : unidad?.nombre ?? '';
  const normalizado = valor.trim().toLowerCase();

  const esPeso = ['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos', 'g', 'gr', 'gramo', 'gramos'].includes(normalizado);
  const esVolumen = ['l', 'lt', 'lts', 'litro', 'litros', 'ml', 'mililitro', 'mililitros'].includes(normalizado);

  if (preferirUnidadesPequenas) {
    if (esPeso) return 'GR';
    if (esVolumen) return 'ML';
  } else {
    if (esPeso) return normalizado.startsWith('g') ? 'GR' : 'KG';
    if (esVolumen) return normalizado.startsWith('m') ? 'ML' : 'L';
  }

  if (['un', 'u', 'unidad', 'unidades'].includes(normalizado)) return 'UN';

  return valor.toUpperCase();
}
