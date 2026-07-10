import { DashboardPeriodo } from '../../../../core/models/domain/dashboard';

export interface DashboardDateRange {
  desde: Date;
  hasta: Date;
}

export function extraerImporte(valor: string): number {
  return Number(valor.replace(/[^0-9]/g, '')) || 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(value);
}

export function parseFecha(fecha: string): Date | null {
  if (!fecha) return null;
  const partes = fecha.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, anio] = partes.map(Number);
  if (!dia || !mes || !anio) return null;
  return new Date(anio, mes - 1, dia);
}

export function obtenerRangoFechas(
  periodo: DashboardPeriodo,
  fechaDesde: string,
  fechaHasta: string,
  fechaBase = new Date()
): DashboardDateRange {
  const hoy = new Date(fechaBase);
  hoy.setHours(0, 0, 0, 0);

  let desde = new Date(hoy);
  let hasta = new Date(hoy);
  hasta.setHours(23, 59, 59, 999);

  switch (periodo) {
    case '1d': break;
    case '3d': desde.setDate(desde.getDate() - 2); break;
    case '7d': desde.setDate(desde.getDate() - 6); break;
    case '30d': desde.setDate(desde.getDate() - 29); break;
    case '365d': desde.setDate(desde.getDate() - 364); break;
    case 'custom':
      const parsedDesde = parseFecha(fechaDesde);
      const parsedHasta = parseFecha(fechaHasta);
      if (parsedDesde) desde = parsedDesde;
      if (parsedHasta) {
        hasta = new Date(parsedHasta);
        hasta.setHours(23, 59, 59, 999);
      }
      break;
  }

  return { desde, hasta };
}

export function diasPersonalizados(fechaDesde: string, fechaHasta: string): number {
  const desde = parseFecha(fechaDesde);
  const hasta = parseFecha(fechaHasta);
  if (!desde || !hasta) return 7;
  const diff = Math.abs(hasta.getTime() - desde.getTime());
  return Math.max(1, Math.round(diff / 86400000) + 1);
}

export function diasDelPeriodo(periodo: DashboardPeriodo, fechaDesde: string, fechaHasta: string): number {
  switch (periodo) {
    case '1d': return 1;
    case '3d': return 3;
    case '7d': return 7;
    case '30d': return 30;
    case '365d': return 365;
    case 'custom': return diasPersonalizados(fechaDesde, fechaHasta);
  }
}

export function etiquetaGrafico(etiqueta: string): string {
  const partes = etiqueta.split('-');

  if (partes.length === 3) {
    const date = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    const nombresDias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    return nombresDias[date.getDay()];
  }

  if (partes.length === 2) {
    const indexMes = parseInt(partes[1], 10) - 1;
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    if (indexMes >= 0 && indexMes < 12) return nombresMeses[indexMes];
  }

  return etiqueta;
}
