export interface Llamado {
  id: number;
  mozoId: number | null;
  mesaId: number | null;
  numeroDeMesa: number;
  gerenteId: number | null;
  categoriaLlamadoId: number;
  categoriaDescripcion: string;
  descripcion: string;
  resuelto: boolean;
}

export interface LlamadoMozo {
  mesaId: number;
  categoriaLlamadoId: number;
  descripcion: string;
  restauranteId?: number;
}

export type TipoLlamado = 'admin' | 'cocina' | 'mesa';

export enum CategoriaLlamado {
  Hielo       = 1,
  Sal         = 2,
  General     = 3,
  Servilleta  = 4,
  Condimentos = 5,
  Panera      = 6,
  Pago        = 7,
  Cocina      = 8,
  Gerente     = 9,
}