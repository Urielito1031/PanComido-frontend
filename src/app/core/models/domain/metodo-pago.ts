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

export const METODO_PAGO_LABELS: Record<MetodoPagoId, string> = {
  [MetodoPagoId.Efectivo]: 'efectivo',
  [MetodoPagoId.Tarjeta]: 'tarjeta',
  [MetodoPagoId.Transferencia]: 'transferencia',
  [MetodoPagoId.MercadoPago]: 'Mercado Pago',
};