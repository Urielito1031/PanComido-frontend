export type DashboardPeriodo = '1d' | '3d' | '7d' | '30d' | '365d' | 'custom';

export type DashboardDestino = 'stock' | 'carta' | 'proveedores' | 'pedido' | 'vencimientos';

export interface WidgetLayout {
  id: string;
  colSpan: number;
}

export interface FavoriteWidgetConfig {
  id: string;
  width: '25' | '50' | '100';
}

export interface DashboardRankingItem {
  nombre: string;
  valor: number;
  detalle: string;
}

export interface DashboardInsumoVencimiento {
  nombre: string;
  fecha: string;
  cantidad: string;
  criticidad: 'alta' | 'media' | 'baja';
  relativo: string;
}

export interface DashboardLecturaComercial {
  titulo: string;
  detalle: string;
  tono: 'success' | 'warning' | 'info';
}

export interface DashboardAtencionItem {
  titulo: string;
  detalle: string;
  accion: string;
  destino: DashboardDestino;
  tono: 'danger' | 'warning' | 'info';
}

export interface DashboardAccionItem {
  id?: number;
  titulo: string;
  detalle: string;
  destino: DashboardDestino;
  tono: 'danger' | 'warning' | 'info';
  impacto: string;
  prioridad: number;
}

export interface DashboardVentaMensual {
  mes: string;
  ventas: number;
}

export interface DashboardVentaDia {
  dia: string;
  fecha: string;
  ventas: number;
}
export type DashboardViewMode = 'favoritos' | 'reportes' | 'finanzas' | 'personal' | 'operativo';

export interface PlatoSugerencia {
  accion: string;
  impacto: string;
  dificultad: 'baja' | 'media' | 'alta';
  tipo: 'descuento' | 'destacado' | 'combo' | 'pausa';
  esAplicable: boolean;
  aplicada: boolean;
}

export interface PlatoAnalisis {
  platoId?: number;
  plato: DashboardRankingItem;
  diagnostico: string;
  sugerenciasDetalladas: PlatoSugerencia[];
  alerta: 'critica' | 'moderada';
  metricas: {
    volumen: string;
    volumenVar: string;
    costo: string;
    precio: string;
    margenPct: string;
    participacion: string;
  };
  comparativa: {
    nombre: string;
    precio: string;
    ventas: string;
  };
  tendencia: number[];
}

export interface EstadisticaMozo {
  nombre: string;
  mesasAtendidas: number;
  facturacionTotal: number;
  tiempoPromedioAtencion: string;
  estado: 'Sobrecargado' | 'Optimo' | 'Baja carga';
}
