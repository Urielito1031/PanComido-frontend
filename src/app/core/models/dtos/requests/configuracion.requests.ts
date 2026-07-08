export interface ActualizarDatosLocalRequest {
  nombre: string;
  colorPrincipal: string | null;
  colorSecundario: string | null;
  familiaTipograficaId: number | null;
  linkResenaGoogleMaps?: string | null;
}

export interface ActualizarMetodoPagoRequest {
  id: number;
  habilitado: boolean;
}

export interface ActualizarTurnoLaboralRequest {
  id: number;
  horarioInicio: string;
  horarioFin: string;
  esNocturno: boolean;
}
export interface ActualizarFilaVirtualRequest {
  habilitada: boolean;
}
export interface PorcentajeItemRequest {
  id: number;
  porcentaje: number;
}
export interface ActualizarPorcentajeGananciaRequest {
  platos: PorcentajeItemRequest[];
  bebidas: PorcentajeItemRequest[];
}

export interface ActualizarDatosTransferenciaRequest {
  alias: string;
  cbu: string | null;
  numeroCuenta: string;
  titularCuenta: string;
}

export interface ReglaTiempoExtraRequest {
  porcentajeOcupacionHasta: number;
  minutosExtra: number;
}
