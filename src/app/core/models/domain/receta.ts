export interface InsumoRecetaDisponible {
  id: number;
  nombre: string;
  unidadMedida: string;
  costoUnitario: number;
}

export interface InsumoBebidaDisponible extends InsumoRecetaDisponible {
  categoria: string;
}
