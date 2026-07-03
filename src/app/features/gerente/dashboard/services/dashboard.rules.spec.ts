import { describe, expect, it } from 'vitest';
import {
  diasDelPeriodo,
  diasPersonalizados,
  etiquetaGrafico,
  extraerImporte,
  formatCurrency,
  obtenerRangoFechas,
  parseFecha
} from './dashboard.rules';

describe('dashboard.rules', () => {
  it('extrae importes desde textos de moneda', () => {
    expect(extraerImporte('$ 1.500')).toBe(1500);
    expect(extraerImporte('ARS 20,000')).toBe(20000);
    expect(extraerImporte('sin datos')).toBe(0);
  });

  it('formatea moneda argentina sin decimales', () => {
    expect(formatCurrency(1500)).toContain('1.500');
  });

  it('parsea fechas en formato dd/mm/yyyy', () => {
    expect(parseFecha('02/07/2026')?.toISOString()).toContain('2026-07-02');
    expect(parseFecha('2026-07-02')).toBeNull();
  });

  it('calcula rangos para periodos fijos y custom', () => {
    const base = new Date('2026-07-02T15:30:00');
    const semana = obtenerRangoFechas('7d', '', '', base);
    expect(semana.desde.toISOString()).toContain('2026-06-26');
    expect(semana.hasta.toISOString()).toContain('2026-07-03');

    const custom = obtenerRangoFechas('custom', '01/07/2026', '02/07/2026', base);
    expect(custom.desde.toISOString()).toContain('2026-07-01');
    expect(custom.hasta.toISOString()).toContain('2026-07-03');
  });

  it('calcula días de periodos y rango personalizado', () => {
    expect(diasDelPeriodo('30d', '', '')).toBe(30);
    expect(diasPersonalizados('01/07/2026', '03/07/2026')).toBe(3);
    expect(diasDelPeriodo('custom', '01/07/2026', '03/07/2026')).toBe(3);
  });

  it('convierte etiquetas de gráfico a nombres legibles', () => {
    expect(etiquetaGrafico('2026-07')).toBe('Julio');
    expect(etiquetaGrafico('2026-07-02')).toBe('Jue');
    expect(etiquetaGrafico('total')).toBe('total');
  });
});
