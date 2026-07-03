import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { RealizarPedidoSugeridoComponent } from './realizar-pedido-sugerido';
import { ProveedorApiService } from '../../services/proveedor.api';
import { Proveedor, SugerenciaPedidoItem } from '../../../../core/models/domain/proveedor';

describe('RealizarPedidoSugeridoComponent', () => {
  let component: RealizarPedidoSugeridoComponent;
  let fixture: ComponentFixture<RealizarPedidoSugeridoComponent>;
  let routerMock: any;
  let proveedorServiceMock: any;

  const mockProveedor: Proveedor = {
    id: 1,
    nombre: 'Distribuidora Sur',
    contacto: 'Mariela Gómez',
    telefono: '+54 11 5555-1200',
    email: 'ventas@distribuidorasur.com',
    direccion: 'Av. San Martín 1200, CABA',
    activo: true,
    fechaUltimoPedido: '2026-05-18T09:00:00.000Z',
    categorias: ['Verdura', 'Carne'],
    historialPedidos: []
  };

  const mockSugerencias: SugerenciaPedidoItem[] = [
    {
      productoId: '5',
      nombre: 'Tomate Perita',
      unidadMedida: { id: 1, nombre: 'Kg' },
      stockActual: 12,
      stockMinimo: 5,
      cantidadSugerida: 10,
      precioUnitario: 1100
    }
  ];

  beforeEach(() => {
    routerMock = {
      navigate: vi.fn()
    };

    proveedorServiceMock = {
      getProveedores: vi.fn().mockReturnValue(of([mockProveedor])),
      getProveedorById: vi.fn().mockReturnValue(of(mockProveedor)),
      getInsumosAReponer: vi.fn().mockReturnValue(of(mockSugerencias)),
      getProductosDisponibles: vi.fn().mockReturnValue(of([])),
      crearPedidoProveedor: vi.fn().mockReturnValue(of(mockProveedor)),
      getBodegas: vi.fn().mockReturnValue(of([])),
      getHistorialCantidadPedidos: vi.fn().mockReturnValue(of([])),
      getInsumosProveedor: vi.fn().mockReturnValue(of([])),
    };
  });

  async function createComponent(routeId: string | null = '1') {
    await TestBed.configureTestingModule({
      imports: [RealizarPedidoSugeridoComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: vi.fn().mockReturnValue(routeId) } } } },
        { provide: ProveedorApiService, useValue: proveedorServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RealizarPedidoSugeridoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('debería crearse correctamente', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('debería cargar datos con el id del proveedor', async () => {
    await createComponent();
    expect(proveedorServiceMock.getProveedores).toHaveBeenCalled();
  });

  it('debería cambiar el término de búsqueda al cambiar el buscador', async () => {
    await createComponent();
    component.onSearchChanged('Tomate');
    expect(component.busquedaProveedor()).toBe('Tomate');
  });

  it('debería calcular subtotal de gramos con precio por kilo', async () => {
    await createComponent();
    const item: SugerenciaPedidoItem = {
      productoId: '10',
      nombre: 'Albahaca',
      unidadMedida: { id: 2, nombre: 'GR' },
      stockActual: 200,
      stockMinimo: 500,
      cantidadSugerida: 10002,
      precioUnitario: 900
    };

    expect(component.subtotalItem(item)).toBeCloseTo(9001.8);
  });

  it('debería elevar sugerencias en gramos al mínimo práctico de compra', async () => {
    proveedorServiceMock.getInsumosAReponer.mockReturnValue(of([
      {
        productoId: '10',
        nombre: 'Albahaca',
        unidadMedida: { id: 2, nombre: 'GR' },
        stockActual: 0.2,
        stockMinimo: 1,
        cantidadSugerida: 2,
        precioUnitario: 900
      }
    ]));

    await createComponent();

    expect(component.itemsProveedor(mockProveedor.id)[0].cantidadSugerida).toBe(100);
    expect(component.cantidadOriginalDisplay(mockProveedor.id, component.itemsProveedor(mockProveedor.id)[0])).toBe('100 gr');
  });

  it('debería limitar cantidades de peso a 100 kg', async () => {
    await createComponent();
    const item = component.itemsProveedor(mockProveedor.id)[0];

    component.setCantidadDisplay(mockProveedor.id, item, 900000);

    expect(component.itemsProveedor(mockProveedor.id)[0].cantidadSugerida).toBe(100);
    expect(component.cantidadDisplay(component.itemsProveedor(mockProveedor.id)[0])).toBe(100000);
    expect(component.cantidadEnMaximo(component.itemsProveedor(mockProveedor.id)[0])).toBe(true);
  });

  it('debería limitar cantidades unitarias a 1000', async () => {
    proveedorServiceMock.getInsumosAReponer.mockReturnValue(of([
      {
        productoId: '7',
        nombre: 'Huevos',
        unidadMedida: { id: 4, nombre: 'UN' },
        stockActual: 20,
        stockMinimo: 60,
        cantidadSugerida: 40,
        precioUnitario: 120
      }
    ]));

    await createComponent();
    const item = component.itemsProveedor(mockProveedor.id)[0];

    component.setCantidadDisplay(mockProveedor.id, item, 9000);

    expect(component.itemsProveedor(mockProveedor.id)[0].cantidadSugerida).toBe(1000);
    expect(component.cantidadEnMaximo(component.itemsProveedor(mockProveedor.id)[0])).toBe(true);
  });

  it('debería navegar hacia atrás al llamar a volver', async () => {
    await createComponent();
    component.volver();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff', 'gerente', 'ver-proveedores']);
  });

  it('debería enviar el pedido correctamente y navegar', async () => {
    await createComponent();
    component.observaciones.set('Observación personalizada');
    component.enviarPedido(mockProveedor);
    expect(proveedorServiceMock.crearPedidoProveedor).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalled();
  });
});
