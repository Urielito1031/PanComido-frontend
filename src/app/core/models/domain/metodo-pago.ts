export interface MetodoPago {
  id: number;
  descripcion: string;
  habilitado: boolean;
}

export enum MetodoPagoId {
  Efectivo = 1,
  Tarjeta = 2,
  Transferencia = 3,
  MercadoPago = 4,
}