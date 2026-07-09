export interface DetallePagoCierreDto {
  metodoPagoId: number;
  metodoPagoNombre: string;
  cantidadPagos: number;
  total: number;
}

export interface CierreCajaDto {
  fecha: string;
  turnoLaboralId: number;
  turnoLaboralNombre: string;
  cantidadTotalDePagos: number;
  totalRecaudado: number;
  detallePagos: DetallePagoCierreDto[];
  diferencia: number;
  sobrante: number;
}
