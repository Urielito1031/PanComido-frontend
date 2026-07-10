import { Insumo } from '../../core/models/domain/insumo';

export const INSUMOS_MOCK: Insumo[] = [
  {
    id: 1,
    nombre: 'Sal',
    stockActual: 2,
    vencimiento: '2028-01-01',
    unidadMedida: { id: 1, nombre: 'Kg' },
    categoriaIngrediente: { id: 1, descripcion: 'Almacen', tipoAplica: 'Ingrediente' },
    stockMinimo: 5,
    esPrecioManual: false,
    esVisibleEnCarta: false,
    costo: 100
  },
  {
    id: 2,
    nombre: 'Harina',
    stockActual: 20,
    vencimiento: '2028-06-01',
    unidadMedida: { id: 2, nombre: 'Kg' },
    categoriaIngrediente: { id: 1, descripcion: 'Almacen', tipoAplica: 'Ingrediente' },
    stockMinimo: 10,
    esPrecioManual: false,
    esVisibleEnCarta: false,
    costo: 300
  }
];
