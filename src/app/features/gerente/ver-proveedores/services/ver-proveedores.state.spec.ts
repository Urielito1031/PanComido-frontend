import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerProveedoresState } from './ver-proveedores.state';
import { ProveedorApiService } from '../../services/proveedor.api';
import { Proveedor, PedidoProveedor } from '../../../../core/models/domain/proveedor';
import { Insumo } from '../../../../core/models/domain/insumo';
import { BrowserNavigationService } from '../../../../core/services/browser-navigation.service';

describe('VerProveedoresState', () => {
  let service: VerProveedoresState;
  let apiServiceMock: any;
  let browserNavigationMock: any;

  const mockProveedores: Proveedor[] = [
    {
      id: 1,
      nombre: 'Distribuidora Sur',
      contacto: 'Mariela Gómez',
      telefono: '+54 11 5555-1200',
      email: 'ventas@distribuidorasur.com',
      direccion: 'Av. San Martín 1200, CABA',
      activo: true,
      fechaUltimoPedido: '2026-05-18T09:00:00.000Z',
      categorias: ['Carne', 'Verdura'],
      historialPedidos: []
    },
    {
      id: 2,
      nombre: 'Proveeduría El Molino',
      contacto: 'Lucas Ferreyra',
      telefono: '+54 11 4444-8800',
      email: 'pedidos@elmolino.com.ar',
      direccion: 'Ruta 8 km 23, Buenos Aires',
      activo: true,
      fechaUltimoPedido: '2026-05-12T15:45:00.000Z',
      categorias: ['Almacen'],
      historialPedidos: []
    }
  ];

  const mockProductos: Insumo[] = [
    { id: 1, nombre: 'Ajo', stockActual: 10, stockMinimo: 5, unidadMedida: { id: 1, nombre: 'Kg' }, categoriaIngrediente: { id: 2, descripcion: 'Verdura', tipoAplica: 'Ingrediente' }, vencimiento: '2026-06-30' },
    { id: 2, nombre: 'Cebolla', stockActual: 2, stockMinimo: 8, unidadMedida: { id: 1, nombre: 'Kg' }, categoriaIngrediente: { id: 2, descripcion: 'Verdura', tipoAplica: 'Ingrediente' }, vencimiento: '2026-06-30' }
  ];

  beforeEach(() => {
    apiServiceMock = {
      getProveedores: vi.fn().mockReturnValue(of([...mockProveedores])),
      getProductosDisponibles: vi.fn().mockReturnValue(of([...mockProductos])),
      getBodegas: vi.fn().mockReturnValue(of([])),
      getHistorialPedidos: vi.fn().mockReturnValue(of([])),
      getInsumosProveedor: vi.fn().mockReturnValue(of([...mockProductos])),
      getCategoriasInsumo: vi.fn().mockReturnValue(of([])),
      confirmarPedido: vi.fn().mockImplementation((pedido: PedidoProveedor) => of({
        pedido: { ...pedido, estado: 'Enviado' },
        linkWpp: 'https://wa.me/5491112345678'
      })),
      previsualizarConfirmacion: vi.fn().mockReturnValue(of([
        {
          insumoId: 1,
          nombreInsumo: 'Ajo',
          cantidad: 2,
          nombreLote: 'Lote A',
          bodegaId: 1,
          fechaVencimiento: '2026-08-01'
        }
      ])),
      recibirPedido: vi.fn().mockReturnValue(of({})),
      crearPedidoProveedor: vi.fn().mockImplementation((id, pedido) => {
        const prov = mockProveedores.find(p => p.id === id);
        if (!prov) throw new Error('Not Found');
        return of({
          id: Date.now(),
          fecha: new Date().toISOString(),
          concepto: pedido.concepto,
          monto: pedido.monto,
          estado: 'Pendiente',
          observacion: pedido.observacion,
          items: pedido.items
        });
      })
    };
    browserNavigationMock = {
      abrirEnNuevaPestana: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        VerProveedoresState,
        { provide: ProveedorApiService, useValue: apiServiceMock },
        { provide: BrowserNavigationService, useValue: browserNavigationMock }
      ]
    });

    service = TestBed.inject(VerProveedoresState);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería cargar proveedores al ejecutar cargarDatos()', () => {
    service.cargarDatos();
    expect(apiServiceMock.getProveedores).toHaveBeenCalled();
    expect(apiServiceMock.getBodegas).toHaveBeenCalled();
    expect(service.proveedores()).toHaveLength(2);
  });

  it('debería seleccionar un proveedor correctamente', () => {
    service.cargarDatos();
    service.seleccionarProveedor(2);
    expect(service.proveedorSeleccionadoId()).toBe(2);
  });

  it('debería abrir el panel de pedido y de historial', () => {
    service.abrirPedido(1);
    expect(service.proveedorSeleccionadoId()).toBe(1);
    expect(service.panelModo()).toBe('pedido');

    service.abrirHistorial(1);
    expect(service.panelModo()).toBe('historial');
  });

  it('debería actualizar los signals al seleccionar un producto', () => {
    service.cargarDatos();
    const prod = mockProductos[0];
    service.seleccionarProducto(prod);

    expect(service.productoSeleccionadoId()).toBe(1);
    expect(service.productoTexto()).toBe('Ajo');
  });

  it('debería autocompletar el producto al cambiar el texto de búsqueda por coincidencia exacta', () => {
    service.cargarDatos();
    service.onProductoTextoChange('Cebolla');
    expect(service.productoSeleccionadoId()).toBe(2);
  });

  it('debería agregar un ingrediente del catálogo al pedido y calcular el montoEstimado', () => {
    service.cargarDatos();
    service.seleccionarProducto(mockProductos[0]);
    service.cantidadProducto.set(2);
    service.precioProductoManual.set(1200);
    service.agregarItemPedido();

    expect(service.pedidoItems()).toHaveLength(1);
    expect(service.pedidoItems()[0].cantidad).toBe(2);
    expect(service.montoEstimado()).toBe(2400);
  });

  it('debería acumular cantidad si se agrega el mismo producto dos veces', () => {
    service.cargarDatos();
    service.seleccionarProducto(mockProductos[0]);
    service.precioProductoManual.set(1200);
    service.cantidadProducto.set(1.5);
    service.agregarItemPedido();

    service.seleccionarProducto(mockProductos[0]);
    service.precioProductoManual.set(1200);
    service.cantidadProducto.set(2.5);
    service.agregarItemPedido();

    expect(service.pedidoItems()).toHaveLength(1);
    expect(service.pedidoItems()[0].cantidad).toBe(4);
    expect(service.montoEstimado()).toBe(4800);
  });

  it('debería permitir actualizar la cantidad de un ingrediente y eliminarlo', () => {
    service.cargarDatos();
    service.seleccionarProducto(mockProductos[0]);
    service.precioProductoManual.set(1200);
    service.agregarItemPedido();

    service.actualizarCantidadItem(1, 5);
    expect(service.pedidoItems()[0].cantidad).toBe(5);
    expect(service.montoEstimado()).toBe(6000);

    service.eliminarItemPedido(1);
    expect(service.pedidoItems()).toHaveLength(0);
    expect(service.montoEstimado()).toBe(0);
  });

  it('debería enviar el pedido correctamente', () => {
    service.cargarDatos();
    service.seleccionarProducto(mockProductos[0]);
    service.cantidadProducto.set(10);
    service.precioProductoManual.set(1200);
    service.agregarItemPedido();
    service.observacionPedido.set('Entregar por la tarde');

    service.enviarPedido();

    expect(apiServiceMock.crearPedidoProveedor).toHaveBeenCalled();
    expect(service.pedidoItems()).toHaveLength(0);
    expect(service.mensajeAccion()).toContain('correctamente');
  });

  it('debería confirmar un pedido pendiente y abrir el link por navegación externa', () => {
    const pedido: PedidoProveedor = {
      id: 10,
      fecha: '2026-07-02T10:00:00.000Z',
      concepto: 'Pedido de insumos',
      monto: 1200,
      estado: 'Pendiente',
      observacion: '',
      items: []
    };

    service.cargarDatos();
    service.abrirDetallePedido(pedido);
    service.confirmarPedido(pedido);

    expect(apiServiceMock.confirmarPedido).toHaveBeenCalledWith(pedido);
    expect(service.pedidoHistorialSeleccionado()?.estado).toBe('Enviado');
    expect(browserNavigationMock.abrirEnNuevaPestana).toHaveBeenCalledWith('https://wa.me/5491112345678');
  });

  it('debería previsualizar, editar y recibir un pedido enviado', () => {
    const pedido: PedidoProveedor = {
      id: 20,
      fecha: '2026-07-02T10:00:00.000Z',
      concepto: 'Pedido de insumos',
      monto: 2400,
      estado: 'Enviado',
      observacion: '',
      items: [{ id: 1, nombre: 'Ajo', cantidad: 2, unidadMedida: { id: 1, nombre: 'Kg' }, precioUnitario: 1200 }]
    };

    service.cargarDatos();
    service.abrirDetallePedido(pedido);
    service.previsualizarRecepcion(pedido);

    expect(apiServiceMock.previsualizarConfirmacion).toHaveBeenCalledWith(20);
    expect(service.recepcionPedido()).toEqual(pedido);
    expect(service.recepcionItems()[0].cantidad).toBe(2);

    service.actualizarRecepcionItem(1, { cantidad: 3 });
    expect(service.recepcionItems()[0].cantidad).toBe(3);

    service.recibirPedido();

    expect(apiServiceMock.recibirPedido).toHaveBeenCalledWith(20, expect.arrayContaining([
      expect.objectContaining({ insumoId: 1, cantidad: 3 })
    ]));
    expect(service.pedidoHistorialSeleccionado()?.estado).toBe('Recibido');
    expect(service.recepcionPedido()).toBeNull();
    expect(service.mensajeAccion()).toContain('se recibió');
  });
});
