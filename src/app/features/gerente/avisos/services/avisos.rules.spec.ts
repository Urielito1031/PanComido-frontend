import { describe, expect, it } from 'vitest';
import { Aviso } from '../../../../core/models/domain/aviso';
import { Plato } from '../../../../core/models/domain/plato';
import { crearPlatoSugeridoRequest, filtrarAvisos, filtrarSugerenciasCocina } from './avisos.rules';

describe('avisos.rules', () => {
  it('filtra avisos por título, subtítulo o info', () => {
    const avisos: Aviso[] = [
      { id: '1', tipo: 'stock', titulo: 'Stock bajo', subtitulo: 'Tomate', info: 'Reponer' },
      { id: '2', tipo: 'vencimiento', titulo: 'Vence pronto', subtitulo: 'Leche', info: 'Cámara 1' }
    ];

    expect(filtrarAvisos(avisos, 'leche').map(aviso => aviso.id)).toEqual(['2']);
    expect(filtrarAvisos(avisos, 'reponer').map(aviso => aviso.id)).toEqual(['1']);
    expect(filtrarAvisos(avisos, '')).toHaveLength(2);
  });

  it('filtra sugerencias no visibles, no ignoradas y por búsqueda', () => {
    const platos: Plato[] = [
      { id: 1, nombre: 'Risotto', precioVenta: 100, costo: 50, tipo: 'Principal', visible: false, imagen: '', categoria: 'Arroz', receta: [] },
      { id: 2, nombre: 'Milanesa', precioVenta: 100, costo: 50, tipo: 'Principal', visible: true, imagen: '', categoria: 'Carnes', receta: [] },
      { id: 3, nombre: 'Sopa', precioVenta: 100, costo: 50, tipo: 'Entrada', visible: false, imagen: '', categoria: 'Entradas', receta: [] }
    ];

    expect(filtrarSugerenciasCocina(platos, [], '').map(plato => plato.id)).toEqual([1, 3]);
    expect(filtrarSugerenciasCocina(platos, [1], '').map(plato => plato.id)).toEqual([3]);
    expect(filtrarSugerenciasCocina(platos, [], 'arroz').map(plato => plato.id)).toEqual([1]);
  });

  it('arma el request para crear un plato sugerido', () => {
    const request = crearPlatoSugeridoRequest({
      id: 9,
      nombre: 'Tarta de verduras',
      descripcion: 'Aprovecha stock disponible',
      tiempoPreparacion: 25,
      porcionesPosibles: 8,
      ingredientesSugeridos: [
        { insumoId: 1, nombre: 'Acelga', cantidad: 2, unidadMedida: 'KG' }
      ]
    });

    expect(request).toEqual({
      nombre: 'Tarta de verduras',
      descripcion: 'Aprovecha stock disponible',
      precioVentaFinal: 0,
      tiempoPreparacionBase: 25,
      tipoPlatoId: 2,
      categoriaPlatoId: 2,
      urlImagen: '',
      restriccionesIds: [],
      ingredientes: [{ insumoId: 1, cantidad: 2, opcional: false }]
    });
  });
});
