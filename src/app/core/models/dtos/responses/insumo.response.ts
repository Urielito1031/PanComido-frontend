export interface InsumoResponseDto {
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
  precioVentaFinal?: number;
  esPrecioManual: boolean;
  vencimiento: string | null;
  unidadMedida: string;
  categoria: string;
  tipo: string;
  estadoStock: string;
  urlImagen: string | null;
  esVisibleEnCarta: boolean;
  costo: number;
}
