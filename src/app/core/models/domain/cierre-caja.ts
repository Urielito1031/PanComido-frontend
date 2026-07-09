export interface DetallePagoCierre {
  metodoPagoId: number;
  metodoPagoNombre: string;
  cantidadPagos: number;
  total: number;
}

export interface CierreCaja {
  fecha: string;
  turnoLaboralId: number;
  turnoLaboralNombre: string;
  cantidadTotalDePagos: number;
  totalRecaudado: number;
  detallePagos: DetallePagoCierre[];
  diferencia: number;
  sobrante: number;
}

export interface GenerarCierreCajaRequest {
  idTurnoLaboral: number;
  conteoCaja: number;
}
