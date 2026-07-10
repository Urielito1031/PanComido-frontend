export interface DatosTransferencia {
  alias: string;
  cbu: string | null;
  numeroCuenta: string;
  titularCuenta: string;
}

export const DATOS_TRANSFERENCIA_VACIO: DatosTransferencia = {
  alias: '',
  cbu: null,
  numeroCuenta: '',
  titularCuenta: '',
};

export function esDatosTransferenciaValidos(datos: DatosTransferencia): boolean {
  const tieneObligatorios = !!datos.alias.trim() && !!datos.numeroCuenta.trim() && !!datos.titularCuenta.trim();
  const cbuValido = !datos.cbu || datos.cbu.trim().length === 22;
  return tieneObligatorios && cbuValido;
}
