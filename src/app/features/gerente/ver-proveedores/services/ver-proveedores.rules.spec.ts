import { describe, expect, it } from 'vitest';
import { Insumo } from '../../../../core/models/domain/insumo';
import { PedidoProveedor } from '../../../../core/models/domain/proveedor';
import {
  actualizarItemsRecepcion,
  actualizarPedidoEnHistorial,
  agregarItemPedidoALista,
  agregarProductoAPedidoHistorial,
  calcularMontoPedido,
  esProductoSugerido,
  getCantidadConfiguracion,
  productosParaAgregar,
  ultimoPrecioDeInsumo
} from './ver-proveedores.rules';

describe('ver-proveedores.rules', () => {
  const unidadKg = { id: 1, nombre: 'KG' };
  const categoria = { id: 1, descripcion: 'Verdura', tipoAplica: 'Ingrediente' };

  const insumoBase: Insumo = {
    id: 1,
    nombre: 'Ajo',
    stockActual: 10,
    stockMinimo: 5,
    unidadMedida: unidadKg,
    categoriaIngrediente: categoria,
    vencimiento: '2026-12-31'
  };

  it('devuelve configuración de cantidad según unidad de medida', () => {
    expect(getCantidadConfiguracion({ id: 1, nombre: 'UN' })).toEqual({ step: 1, min: 1, placeholder: '1' });
    expect(getCantidadConfiguracion({ id: 2, nombre: 'GR' })).toEqual({ step: 10, min: 10, placeholder: '100' });
    expect(getCantidadConfiguracion({ id: 3, nombre: 'KG' })).toEqual({ step: 0.1, min: 0.1, placeholder: '0.5' });
    expect(getCantidadConfiguracion({ id: 4, nombre: 'L' })).toEqual({ step: 0.1, min: 0.1, placeholder: '0.5' });
  });

  it('marca productos sugeridos por stock bajo o vencimiento cercano', () => {
    const fechaBase = new Date('2026-07-02T00:00:00');

    expect(esProductoSugerido({ ...insumoBase, stockActual: 7, stockMinimo: 5 }, fechaBase)).toBe(true);
    expect(esProductoSugerido({ ...insumoBase, stockActual: 20, stockMinimo: 5, vencimiento: '2026-07-20' }, fechaBase)).toBe(true);
    expect(esProductoSugerido({ ...insumoBase, stockActual: 20, stockMinimo: 5, vencimiento: '2026-10-20' }, fechaBase)).toBe(false);
  });

  it('filtra productos repetidos, ya incluidos y por búsqueda', () => {
    const pedido: PedidoProveedor = {
      id: 1,
      fecha: '2026-07-01T10:00:00.000Z',
      concepto: 'Pedido',
      monto: 100,
      estado: 'Pendiente',
      observacion: '',
      items: [{ id: 2, nombre: 'Cebolla', cantidad: 1, unidadMedida: unidadKg, precioUnitario: 10 }]
    };

    const productos = [
      { ...insumoBase, id: 1, nombre: 'Ajo' },
      { ...insumoBase, id: 1, nombre: 'Ajo duplicado' },
      { ...insumoBase, id: 2, nombre: 'Cebolla' },
      { ...insumoBase, id: 3, nombre: 'Albahaca' }
    ];

    expect(productosParaAgregar(productos, pedido, 'a').map(producto => producto.nombre)).toEqual(['Ajo', 'Albahaca']);
  });

  it('obtiene el último precio válido de un insumo en el historial', () => {
    const historial: PedidoProveedor[] = [
      {
        id: 1,
        fecha: '2026-06-01T10:00:00.000Z',
        concepto: 'Pedido',
        monto: 100,
        estado: 'Recibido',
        observacion: '',
        items: [{ id: 1, nombre: 'Ajo', cantidad: 1, unidadMedida: unidadKg, precioUnitario: 100 }]
      },
      {
        id: 2,
        fecha: '2026-07-01T10:00:00.000Z',
        concepto: 'Pedido',
        monto: 200,
        estado: 'Recibido',
        observacion: '',
        items: [{ id: 1, nombre: 'Ajo', cantidad: 1, unidadMedida: unidadKg, precioUnitario: 200 }]
      }
    ];

    expect(ultimoPrecioDeInsumo(historial, 1)).toBe(200);
    expect(ultimoPrecioDeInsumo(historial, 99)).toBeNull();
  });

  it('calcula monto y acumula items iguales en un pedido', () => {
    const items = [
      { id: 1, nombre: 'Ajo', cantidad: 2, unidadMedida: unidadKg, precioUnitario: 100 },
      { id: 2, nombre: 'Cebolla', cantidad: 3, unidadMedida: unidadKg, precioUnitario: 50 }
    ];

    expect(calcularMontoPedido(items)).toBe(350);

    const actualizados = agregarItemPedidoALista(items, {
      id: 1,
      nombre: 'Ajo',
      cantidad: 4,
      unidadMedida: unidadKg,
      precioUnitario: 120
    });

    expect(actualizados).toHaveLength(2);
    expect(actualizados[0]).toEqual(expect.objectContaining({ cantidad: 6, precioUnitario: 120 }));
  });

  it('agrega productos al pedido dentro del historial y recalcula el monto', () => {
    const historial: PedidoProveedor[] = [
      {
        id: 1,
        fecha: '2026-07-01T10:00:00.000Z',
        concepto: 'Pedido',
        monto: 100,
        estado: 'Pendiente',
        observacion: '',
        items: [{ id: 1, nombre: 'Ajo', cantidad: 1, unidadMedida: unidadKg, precioUnitario: 100 }]
      }
    ];

    const actualizado = agregarProductoAPedidoHistorial(historial, 1, {
      id: 2,
      nombre: 'Cebolla',
      cantidad: 2,
      unidadMedida: unidadKg,
      precioUnitario: 50
    });

    expect(actualizado[0].items).toHaveLength(2);
    expect(actualizado[0].monto).toBe(200);
  });

  it('actualiza pedidos de historial e items de recepción de forma inmutable', () => {
    const pedido: PedidoProveedor = {
      id: 1,
      fecha: '2026-07-01T10:00:00.000Z',
      concepto: 'Pedido',
      monto: 100,
      estado: 'Pendiente',
      observacion: '',
      items: []
    };
    const recibido: PedidoProveedor = { ...pedido, estado: 'Recibido' };

    expect(actualizarPedidoEnHistorial([pedido], recibido)[0].estado).toBe('Recibido');
    expect(actualizarItemsRecepcion([
      { insumoId: 1, nombreInsumo: 'Ajo', cantidad: 1, nombreLote: 'L1', bodegaId: 1, fechaVencimiento: '2026-08-01' }
    ], 1, { cantidad: 3 })[0].cantidad).toBe(3);
  });
});
