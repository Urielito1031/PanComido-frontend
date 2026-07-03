import { describe, expect, it } from 'vitest';
import { Plato } from '../../../../core/models/domain/plato';
import {
  esBebida,
  ordenarPlatosCarta,
  tipoBebida,
  tipoComida,
  tiposDisponibles
} from './modificar-carta.rules';

describe('modificar-carta.rules', () => {
  const basePlato: Plato = {
    id: 1,
    nombre: 'Milanesa',
    precioVenta: 100,
    costo: 50,
    tipo: 'Principal',
    visible: true,
    imagen: '',
    receta: []
  };

  it('clasifica bebidas por categoría, tipo o marca de bebida', () => {
    expect(esBebida({ ...basePlato, categoria: 'Bebidas' })).toBe(true);
    expect(esBebida({ ...basePlato, tipo: 'Bebida' })).toBe(true);
    expect(esBebida({ ...basePlato, bebida: 'Coca-Cola' })).toBe(true);
    expect(esBebida({ ...basePlato, categoria: 'Entradas', tipo: 'Comida' })).toBe(false);
  });

  it('deduce tipos de bebida conocidos cuando el tipo genérico no alcanza', () => {
    expect(tipoBebida({ ...basePlato, nombre: 'Cerveza rubia', tipo: 'Bebida' })).toBe('Cerveza');
    expect(tipoBebida({ ...basePlato, nombre: 'Jugo exprimido', tipo: 'Bebidas' })).toBe('Jugo');
    expect(tipoBebida({ ...basePlato, nombre: 'Agua mineral', tipo: '' })).toBe('Agua');
    expect(tipoBebida({ ...basePlato, nombre: 'Limonada', tipo: '' })).toBe('Otros');
  });

  it('normaliza plato principal como Principal para comidas', () => {
    expect(tipoComida({ ...basePlato, categoria: 'Plato principal' })).toBe('Principal');
    expect(tipoComida({ ...basePlato, categoria: 'Entradas' })).toBe('Entradas');
  });

  it('agrupa tipos disponibles ordenados alfabéticamente', () => {
    const tipos = tiposDisponibles([
      { ...basePlato, id: 1, categoria: 'Entradas' },
      { ...basePlato, id: 2, categoria: 'Postres' },
      { ...basePlato, id: 3, categoria: 'Entradas' }
    ], tipoComida);

    expect(tipos).toEqual([
      { tipo: 'Entradas', count: 2 },
      { tipo: 'Postres', count: 1 }
    ]);
  });

  it('ordena platos por criterio comercial o por visibilidad por defecto', () => {
    const platos: Plato[] = [
      { ...basePlato, id: 1, precioVenta: 100, ventas: 5, visible: false, recomendado: true },
      { ...basePlato, id: 2, precioVenta: 200, ventas: 1, visible: true, recomendado: false },
      { ...basePlato, id: 3, precioVenta: 50, ventas: 10, visible: false, recomendado: false }
    ];

    expect(ordenarPlatosCarta(platos, 'ventas-desc').map(plato => plato.id)).toEqual([3, 1, 2]);
    expect(ordenarPlatosCarta(platos, 'precio-asc').map(plato => plato.id)).toEqual([3, 1, 2]);
    expect(ordenarPlatosCarta(platos, 'default').map(plato => plato.id)).toEqual([2, 3, 1]);
  });
});
