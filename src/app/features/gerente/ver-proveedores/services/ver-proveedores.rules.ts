import { Insumo } from '../../../../core/models/domain/insumo';
import { UnidadMedida } from '../../../../core/models/domain/unidad-medida';
import { PedidoProveedor, PedidoProveedorItem, RecepcionPedidoItem } from '../../../../core/models/domain/proveedor';

export interface CantidadConfiguracion {
  step: number;
  min: number;
  placeholder: string;
}

export function getCantidadConfiguracion(unidadMedida: UnidadMedida | string): CantidadConfiguracion {
  const nombreUnidad = typeof unidadMedida === 'string' ? unidadMedida : unidadMedida.nombre;

  switch (nombreUnidad.trim().toUpperCase()) {
    case 'UNIDAD':
    case 'UNIDADES':
    case 'UN':
    case 'PORCION':
    case 'PORCIONES':
      return { step: 1, min: 1, placeholder: '1' };
    case 'GR':
    case 'GRAMO':
    case 'GRAMOS':
      return { step: 10, min: 10, placeholder: '100' };
    case 'KILO':
    case 'KILOS':
    case 'KG':
      return { step: 0.1, min: 0.1, placeholder: '0.5' };
    case 'LITRO':
    case 'LITROS':
    case 'L':
    default:
      return { step: 0.1, min: 0.1, placeholder: '0.5' };
  }
}

export function getCantidadInicial(unidadMedida: UnidadMedida | string): number {
  return getCantidadConfiguracion(unidadMedida).min;
}

export function esProductoSugerido(producto: Insumo, fechaBase = new Date()): boolean {
  const vencimiento = new Date(`${producto.vencimiento}T00:00:00`);
  const dias = Math.ceil((vencimiento.getTime() - fechaBase.getTime()) / 86400000);
  return producto.stockActual < producto.stockMinimo * 1.5 || dias <= 30;
}

export function productosParaAgregar(
  productos: Insumo[],
  pedidoSeleccionado: PedidoProveedor | null,
  busqueda: string
): Insumo[] {
  const texto = busqueda.toLowerCase().trim();
  const vistos = new Set<string>();
  const itemsPedido = pedidoSeleccionado?.items ?? [];

  const candidatos = productos
    .filter(producto => {
      const nombre = producto.nombre?.trim();
      const id = producto.id?.toString();
      if (!nombre || !id || vistos.has(id)) return false;
      vistos.add(id);
      return !itemsPedido.some(item => item.id.toString() === id);
    })
    .sort((a, b) => {
      const sugeridoA = esProductoSugerido(a) ? 0 : 1;
      const sugeridoB = esProductoSugerido(b) ? 0 : 1;
      return sugeridoA - sugeridoB || a.nombre.localeCompare(b.nombre);
    });

  if (!texto) return candidatos;
  return candidatos.filter(producto => producto.nombre.toLowerCase().includes(texto));
}

export function unidadBaseParaPedido(unidadMedida: UnidadMedida): UnidadMedida;
export function unidadBaseParaPedido(unidadMedida: string): string;
export function unidadBaseParaPedido(unidadMedida: UnidadMedida | string): UnidadMedida | string {
  const nombreUnidad = (typeof unidadMedida === 'string' ? unidadMedida : unidadMedida.nombre).trim().toUpperCase();

  if (['G', 'GR', 'GRAMO', 'GRAMOS'].includes(nombreUnidad)) {
    return typeof unidadMedida === 'string' ? 'Kg' : { ...unidadMedida, nombre: 'Kg' };
  }

  if (['ML', 'MILILITRO', 'MILILITROS'].includes(nombreUnidad)) {
    return typeof unidadMedida === 'string' ? 'Litro' : { ...unidadMedida, nombre: 'Litro' };
  }

  return unidadMedida;
}

export function normalizarCantidadAUnidadBase(cantidad: number, unidadMedida: UnidadMedida | string): number {
  const nombreUnidad = (typeof unidadMedida === 'string' ? unidadMedida : unidadMedida.nombre).trim().toUpperCase();

  if (['G', 'GR', 'GRAMO', 'GRAMOS', 'ML', 'MILILITRO', 'MILILITROS'].includes(nombreUnidad)) {
    return cantidad / 1000;
  }

  return cantidad;
}

export function ultimoPrecioDeInsumo(historial: PedidoProveedor[], insumoId: number | string): number | null {
  const pedidosOrdenados = [...historial].sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime();
    const fechaB = new Date(b.fecha).getTime();
    return fechaB - fechaA;
  });

  for (const pedido of pedidosOrdenados) {
    const item = pedido.items.find(i => i.id.toString() === insumoId.toString());
    if (tienePrecioValido(item)) return item.precioUnitario;
  }

  return null;
}

export function calcularMontoPedido(items: PedidoProveedorItem[]): number {
  return items.reduce((total, item) => total + (item.precioUnitario ?? 0) * item.cantidad, 0);
}

export function agregarItemPedidoALista(items: PedidoProveedorItem[], itemNuevo: PedidoProveedorItem): PedidoProveedorItem[] {
  const existe = items.some(item => item.id.toString() === itemNuevo.id.toString());

  if (!existe) return [...items, itemNuevo];

  return items.map(item => item.id.toString() === itemNuevo.id.toString()
    ? { ...item, cantidad: item.cantidad + itemNuevo.cantidad, precioUnitario: itemNuevo.precioUnitario }
    : item
  );
}

export function agregarProductoAPedidoHistorial(
  historial: PedidoProveedor[],
  pedidoId: number | string,
  itemNuevo: PedidoProveedorItem
): PedidoProveedor[] {
  return historial.map(pedido => {
    if (pedido.id !== pedidoId) return pedido;

    const items = agregarItemPedidoALista(pedido.items, itemNuevo);
    return { ...pedido, items, monto: calcularMontoPedido(items) };
  });
}

export function actualizarPedidoEnHistorial(historial: PedidoProveedor[], pedidoActualizado: PedidoProveedor): PedidoProveedor[] {
  return historial.map(pedido => pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido);
}

export function actualizarItemsRecepcion(
  items: RecepcionPedidoItem[],
  insumoId: number,
  cambios: Partial<RecepcionPedidoItem>
): RecepcionPedidoItem[] {
  return items.map(item => item.insumoId === insumoId ? { ...item, ...cambios } : item);
}

function tienePrecioValido(item: PedidoProveedorItem | undefined): item is PedidoProveedorItem & { precioUnitario: number } {
  return !!item && typeof item.precioUnitario === 'number' && item.precioUnitario > 0;
}
