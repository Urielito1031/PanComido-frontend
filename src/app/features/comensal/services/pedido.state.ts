import { Injectable, signal, computed } from '@angular/core';
import { ItemPedido } from '../../../core/models/domain/item-pedido';

@Injectable({
  providedIn: 'root',
})
export class PedidoState {
  // Signal reactivo para los pedidos
  private pedidosSignal = signal<ItemPedido[]>(this.leerDelStorage());

  pedidos = this.pedidosSignal.asReadonly();

  // Computed para cantidad total
  cantidadTotal = computed(() => {
    return this.pedidosSignal().reduce((acc, item) => {
      if (!item) return acc;
      return acc + item.cantidad;
    }, 0);
  });

  totalPrecio = computed(() => {
    return this.pedidosSignal().reduce((acc, item) => {
      if (!item?.plato) return acc;            
      return acc + (item.plato.precio * item.cantidad);
    }, 0);
  });

  agregarPedido(item: ItemPedido) {
    this.pedidosSignal.update((pedidos) => {
      const nuevos = [...pedidos, item];
      this.guardarEnStorage(nuevos);
      return nuevos;
    });
  }

  obtenerPedidos(): ItemPedido[] {
    return this.pedidosSignal();
  }

  actualizarObservaciones(
    index: number,
    observacionesIngredientes: number[],
    observacionesGenerales: string,
  ) {
    this.pedidosSignal.update((pedidos) => {
      const nuevoPedidos = [...pedidos];
      nuevoPedidos[index] = {
        ...nuevoPedidos[index],
        observacionesIngredientes,
        observacionesGenerales,
      };
      return nuevoPedidos;
    });
  }

  eliminarPedido(index: number) {
    this.pedidosSignal.update((pedidos) => {
      const nuevoPedidos = [...pedidos];
      nuevoPedidos.splice(index, 1);
      return nuevoPedidos;
    });
  }

  limpiarPedidos() {
    this.pedidosSignal.set([]);
    sessionStorage.removeItem('carritoPedido');
  }

  incrementarCantidad(index: number): void {
    this.pedidosSignal.update((pedidos) => {
      const nuevosPedidos = [...pedidos];

      nuevosPedidos[index] = {
        ...nuevosPedidos[index],
        cantidad: nuevosPedidos[index].cantidad + 1,
      };
      this.guardarEnStorage(nuevosPedidos);

      return nuevosPedidos;
    });
  }

  decrementarCantidad(index: number): void {
    this.pedidosSignal.update((pedidos) => {
      const nuevosPedidos = [...pedidos];

      if (nuevosPedidos[index].cantidad > 1) {
        nuevosPedidos[index] = {
          ...nuevosPedidos[index],
          cantidad: nuevosPedidos[index].cantidad - 1,
        };
        this.guardarEnStorage(nuevosPedidos);
      } else {
        nuevosPedidos.splice(index, 1);
      }

      return nuevosPedidos;
    });
  }

  actualizarItem(itemActualizado: ItemPedido) {
    const items = this.pedidosSignal();

    const index = items.findIndex((i) => i.plato.id === itemActualizado.plato.id);

    if (index === -1) return;

    const nuevosItems = [...items];

    nuevosItems[index] = {
      ...nuevosItems[index],
      ...itemActualizado,
    };
    this.guardarEnStorage(nuevosItems);
    this.pedidosSignal.set(nuevosItems);
  }
  private leerDelStorage(): ItemPedido[] {
    try {
      const raw = sessionStorage.getItem('carritoPedido');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) 
        ? parsed.filter((item): item is ItemPedido => 
            item !== null && typeof item.cantidad === 'number'
          )
        : [];
    } catch {
      return [];
    }
  }

  private guardarEnStorage(items: ItemPedido[]): void {
    sessionStorage.setItem('carritoPedido', JSON.stringify(items));
  }

  actualizarItemEnIndice(index: number, itemActualizado: ItemPedido): void {
    this.pedidosSignal.update((items) => {
      if(index < 0 || index >= items.length){
        console.warn(`actualizarItemEnIndice: index ${index} fuera de rango (length ${items.length})`)
        return items;
      }
      
      const nuevos = [...items];
      nuevos[index] = itemActualizado;
      this.guardarEnStorage(nuevos);
      return nuevos;
    });
  }
}
