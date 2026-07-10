import { Pipe, PipeTransform } from '@angular/core';

const MAPA: Record<string, string> = {
  kg: 'KILOGRAMOS',
  gr: 'GRAMOS',
  lt: 'LITROS',
  ml: 'MILILITROS',
  unidad: 'UNIDADES',
  porción: 'PORCIONES',
  porcion: 'PORCIONES',
};

@Pipe({
  name: 'unidadNormalizada',
})
export class UnidadNormalizadaPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    if (!valor) return '';
    const key = valor.trim().toLowerCase();
    return MAPA[key] ?? valor.trim().toUpperCase();
  }
}
