import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { VerProveedoresComponent } from './ver-proveedores';
import { VerProveedoresState } from '../services/ver-proveedores.state';
import { Proveedor, PedidoProveedorItem, PedidoProveedor } from '../../../../core/models/domain/proveedor';
import { Insumo } from '../../../../core/models/domain/insumo';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormBuilder } from '@angular/forms';

describe('VerProveedoresComponent', () => {
  let component: VerProveedoresComponent;
  let fixture: ComponentFixture<VerProveedoresComponent>;
  let stateMock: any;
  let routerMock: any;

  const mockProveedor: Proveedor = {
    id: 1,
    nombre: 'Proveedor Test',
    telefono: '12345678',
    contacto: '',
    email: '',
    direccion: '',
    categorias: [],
    historialPedidos: []
  };

  beforeEach(async () => {
    stateMock = {
      termino: signal(''),
      proveedores: signal([mockProveedor]),
      productos: signal([]),
      proveedorSeleccionadoId: signal<number | string | null>(1),
      panelModo: signal('historial'),
      observacionPedido: signal(''),
      mensajeAccion: signal(null),
      productoTexto: signal(''),
      productoSeleccionadoId: signal<number | string | null>(null),
      cantidadProducto: signal<number | null>(1),
      precioProductoManual: signal<number | null>(null),
      pedidoItems: signal<PedidoProveedorItem[]>([]),
      pedidoHistorialSeleccionado: signal(null),
      proveedoresFiltrados: signal([mockProveedor]),
      productosFiltrados: signal([]),
      proveedorSeleccionado: signal(mockProveedor),
      productoBaseActual: signal(null),
      pedidosListosParaRecibir: signal([]),
      loading: signal(false),
      loadingHistorial: signal(false),
      loadingInsumos: signal(false),
      totalPedidosSeleccionado: signal(0),
      error: signal(null),
      errorHistorial: signal(null),
      errorInsumos: signal(null),
      historialProveedor: signal([]),
      categoriasInsumo: signal([]),

      cargarDatos: vi.fn(),
      actualizarProveedor: vi.fn(),
      eliminarProveedor: vi.fn(),
      seleccionarProveedor: vi.fn(),
      abrirPedido: vi.fn(),
      abrirHistorial: vi.fn(),
      abrirDetallePedido: vi.fn(),
      cerrarDetallePedido: vi.fn(),
      limpiarPedido: vi.fn(),
      seleccionarProducto: vi.fn(),
      onProductoTextoChange: vi.fn(),
      agregarItemPedido: vi.fn(),
      actualizarCantidadItem: vi.fn(),
      eliminarItemPedido: vi.fn(),
      enviarPedido: vi.fn(),
      cargarHistorial: vi.fn(),
      cargarInsumosProveedor: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [VerProveedoresComponent],
      providers: [
        { provide: VerProveedoresState, useValue: stateMock },
        { provide: Router, useValue: routerMock },
        FormBuilder
      ]
    })
    .overrideComponent(VerProveedoresComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerProveedoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar datos al inicializar', () => {
    expect(stateMock.cargarDatos).toHaveBeenCalled();
  });

  it('debería navegar a nuevo proveedor', () => {
    component.abrirNuevoProveedorRoute();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff', 'gerente', 'nuevo-proveedor']);
  });

  it('debería setear proveedor editando y resetear el form al abrirEditarProveedor', () => {
    component.abrirEditarProveedor(mockProveedor);
    expect(component.proveedorEditando()).toEqual(mockProveedor);
    expect(component.proveedorForm.value.nombre).toBe('Proveedor Test');
  });

  it('debería llamar a state.actualizarProveedor al guardarEdicionProveedor con form válido', () => {
    component.abrirEditarProveedor(mockProveedor);
    component.toggleCategoriaEdicion({ id: 1, descripcion: 'Carnes', tipoAplica: 'Insumo' });
    component.proveedorForm.controls.nombre.setValue('Editado');
    component.guardarEdicionProveedor();

    expect(stateMock.actualizarProveedor).toHaveBeenCalledWith(1, expect.objectContaining({ nombre: 'Editado' }), expect.any(Function));
  });

  it('debería delegar eliminar proveedor al state', () => {
    component.abrirEliminarProveedor(mockProveedor);
    component.confirmarEliminarProveedor();
    expect(stateMock.eliminarProveedor).toHaveBeenCalledWith(1, expect.any(Function));
  });

  it('debería delegar onProductoTextoChange al state', () => {
    component.onProductoTextoChange('Papa');
    expect(stateMock.onProductoTextoChange).toHaveBeenCalledWith('Papa');
  });

  it('debería delegar agregarItemPedido al state', () => {
    component.agregarItemPedido();
    expect(stateMock.agregarItemPedido).toHaveBeenCalled();
  });

  it('debería delegar enviarPedido al state', () => {
    component.enviarPedido();
    expect(stateMock.enviarPedido).toHaveBeenCalled();
  });
});
