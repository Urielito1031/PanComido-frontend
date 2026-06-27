import { vi } from 'vitest';
import { PedidoState } from './pedido.state';
import { ItemPedido } from '../../../core/models/domain/item-pedido';

describe('PedidoState', () => {
  let state: PedidoState;

  const mockItem: ItemPedido = {
    plato: { id: 1, nombre: 'Pizza', precio: 1500 },
    cantidad: 2,
    observacionesIngredientes: [3],
    observacionesGenerales: 'Sin cebolla',
  };

  const mockItem2: ItemPedido = {
    plato: { id: 2, nombre: 'Empanada', precio: 500 },
    cantidad: 3,
  };

  beforeEach(() => {
    sessionStorage.clear();
    state = new PedidoState();
  });

  describe('initial state', () => {
    it('debería iniciar con pedidos vacío', () => {
      expect(state.pedidos()).toEqual([]);
      expect(state.cantidadTotal()).toBe(0);
      expect(state.totalPrecio()).toBe(0);
    });
  });

  describe('agregarPedido', () => {
    it('debería agregar item a la señal pedidos', () => {
      state.agregarPedido(mockItem);
      expect(state.pedidos().length).toBe(1);
      expect(state.pedidos()[0]).toEqual(mockItem);
    });

    it('debería guardar en sessionStorage', () => {
      state.agregarPedido(mockItem);
      const stored = JSON.parse(sessionStorage.getItem('carritoPedido')!);
      expect(stored).toEqual([mockItem]);
    });

    it('debería agregar múltiples items', () => {
      state.agregarPedido(mockItem);
      state.agregarPedido(mockItem2);
      expect(state.pedidos().length).toBe(2);
    });
  });

  describe('computed values', () => {
    it('debería calcular cantidadTotal de todos los items', () => {
      state.agregarPedido(mockItem);
      state.agregarPedido(mockItem2);
      expect(state.cantidadTotal()).toBe(5);
    });

    it('debería calcular totalPrecio como suma de plato.precio * cantidad', () => {
      state.agregarPedido(mockItem);
      state.agregarPedido(mockItem2);
      expect(state.totalPrecio()).toBe(4500);
    });

    it('debería manejar pedidos vacío en totalPrecio', () => {
      expect(state.totalPrecio()).toBe(0);
    });
  });

  describe('obtenerPedidos', () => {
    it('debería devolver el array de pedidos actual', () => {
      state.agregarPedido(mockItem);
      expect(state.obtenerPedidos()).toEqual([mockItem]);
    });
  });

  describe('actualizarObservaciones', () => {
    it('debería actualizar observaciones en un índice específico', () => {
      state.agregarPedido(mockItem);
      state.actualizarObservaciones(0, [1, 2], 'Sin sal');

      const updated = state.pedidos()[0];
      expect(updated.observacionesIngredientes).toEqual([1, 2]);
      expect(updated.observacionesGenerales).toBe('Sin sal');
    });
  });

  describe('eliminarPedido', () => {
    it('debería eliminar item en el índice', () => {
      state.agregarPedido(mockItem);
      state.agregarPedido(mockItem2);
      state.eliminarPedido(0);
      expect(state.pedidos().length).toBe(1);
      expect(state.pedidos()[0].plato.id).toBe(2);
    });
  });

  describe('limpiarPedidos', () => {
    it('debería limpiar todos los pedidos', () => {
      state.agregarPedido(mockItem);
      state.limpiarPedidos();
      expect(state.pedidos()).toEqual([]);
    });

    it('debería eliminar item de sessionStorage', () => {
      state.agregarPedido(mockItem);
      state.limpiarPedidos();
      expect(sessionStorage.getItem('carritoPedido')).toBeNull();
    });
  });

  describe('incrementarCantidad', () => {
    it('debería incrementar cantidad en el índice', () => {
      state.agregarPedido(mockItem);
      state.incrementarCantidad(0);
      expect(state.pedidos()[0].cantidad).toBe(3);
    });
  });

  describe('decrementarCantidad', () => {
    it('debería decrementar cantidad cuando > 1', () => {
      state.agregarPedido(mockItem);
      state.decrementarCantidad(0);
      expect(state.pedidos()[0].cantidad).toBe(1);
    });

    it('debería eliminar item cuando cantidad llegaría a 0', () => {
      const single: ItemPedido = { plato: { id: 3, nombre: 'Pochoclo', precio: 200 }, cantidad: 1 };
      state.agregarPedido(single);
      state.decrementarCantidad(0);
      expect(state.pedidos().length).toBe(0);
    });
  });

  describe('actualizarItem', () => {
    it('debería actualizar item que coincida con plato.id', () => {
      state.agregarPedido(mockItem);
      state.actualizarItem({ plato: { id: 1, nombre: 'Pizza', precio: 2000 }, cantidad: 4 });

      const item = state.pedidos()[0];
      expect(item.cantidad).toBe(4);
      expect(item.plato.precio).toBe(2000);
    });

    it('debería no hacer nada cuando no se encuentra plato.id', () => {
      state.agregarPedido(mockItem);
      state.actualizarItem({ plato: { id: 999, nombre: 'X', precio: 0 }, cantidad: 1 });
      expect(state.pedidos()[0].plato.id).toBe(1);
    });
  });

  describe('actualizarItemEnIndice', () => {
    it('debería actualizar item en el índice', () => {
      state.agregarPedido(mockItem);
      const update: ItemPedido = { plato: { id: 1, nombre: 'Pizza', precio: 2000 }, cantidad: 4 };
      state.actualizarItemEnIndice(0, update);
      expect(state.pedidos()[0]).toEqual(update);
    });

    it('debería no hacer nada si el índice está fuera de rango', () => {
      state.agregarPedido(mockItem);
      const original = state.pedidos();
      state.actualizarItemEnIndice(5, mockItem2);
      expect(state.pedidos()).toEqual(original);
    });

    it('debería no hacer nada si el índice es negativo', () => {
      state.agregarPedido(mockItem);
      const original = state.pedidos();
      state.actualizarItemEnIndice(-1, mockItem2);
      expect(state.pedidos()).toEqual(original);
    });
  });

  describe('sessionStorage hydration', () => {
    it('debería restaurar pedidos desde sessionStorage al construirse', () => {
      sessionStorage.setItem('carritoPedido', JSON.stringify([mockItem, mockItem2]));
      const restoredState = new PedidoState();
      expect(restoredState.pedidos().length).toBe(2);
      expect(restoredState.pedidos()[0].plato.id).toBe(1);
    });

    it('debería manejar datos corruptos de sessionStorage', () => {
      sessionStorage.setItem('carritoPedido', '{corrupted:::');
      const safeState = new PedidoState();
      expect(safeState.pedidos()).toEqual([]);
    });

    it('debería filtrar items inválidos del storage', () => {
      sessionStorage.setItem(
        'carritoPedido',
        JSON.stringify([{ plato: {}, cantidad: 'invalid' }, mockItem]),
      );
      const filteredState = new PedidoState();
      expect(filteredState.pedidos().length).toBe(1);
    });
  });
});
