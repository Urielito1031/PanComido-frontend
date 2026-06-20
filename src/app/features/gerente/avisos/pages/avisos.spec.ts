import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AvisosPage } from './avisos';
import { AvisosStateService } from '../services/avisos.state';
import { VencimientosState } from '../../aviso-vencimientos/services/vencimientos.state';
import { RealizarPedidoSugeridoStateService } from '../../realizar-pedido-sugerido/services/realizar-pedido-sugerido.state';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Aviso } from '../../../../core/models/domain/aviso';

describe('AvisosPage', () => {
  let component: AvisosPage;
  let fixture: ComponentFixture<AvisosPage>;
  let stateMock: any;
  let pedidoStateMock: any;
  let pedidoSugeridoStateMock: any;
  let routerMock: any;

  const mockAvisoStock: Aviso = {
    id: '1',
    tipo: 'stock',
    titulo: 'Poco Ajo',
    fecha: '2026-06-18',
    payloadStock: { insumoId: 1, stockActual: 2, unidadMedida: 'Kg' }
  };

  const mockAvisoVencimiento: Aviso = {
    id: '2',
    tipo: 'vencimiento',
    titulo: 'Vence Leche',
    fecha: '2026-06-18'
  };

  beforeEach(async () => {
    stateMock = {
      vencimientos: signal([]),
      stockBajo: signal([]),
      sugerencias: signal([]),
      mensaje: signal(null),
      loadingSugerenciasCocina: signal(false),
      platoAgregadoACarta: signal(null),
      sugerenciasIA: signal(null),
      loadingIA: signal(false),
      errorIA: signal(null),
      creandoPlato: signal(null),
      platoIACreado: signal(null),
      
      cargarAvisos: vi.fn(),
      cargarSugerenciasCocina: vi.fn(),
      setSearchTerm: vi.fn(),
      marcarRevisado: vi.fn(),
      generarSugerenciasIA: vi.fn(),
      cerrarConfirmacionCarta: vi.fn()
    };

    pedidoStateMock = {
      proveedoresDisponibles: signal([{ id: 10, nombre: 'Prov 1' }]),
      seleccionarIngredienteParaPedido: vi.fn(),
      limpiarSeleccion: vi.fn(),
      seleccionarProveedor: vi.fn(),
      crearPedidoPendiente: vi.fn().mockReturnValue(of({ id: 10 }))
    };

    pedidoSugeridoStateMock = {
      cargarDatos: vi.fn()
    };

    routerMock = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [AvisosPage],
      providers: [
        { provide: AvisosStateService, useValue: stateMock },
        { provide: VencimientosState, useValue: pedidoStateMock },
        { provide: RealizarPedidoSugeridoStateService, useValue: pedidoSugeridoStateMock },
        { provide: Router, useValue: routerMock }
      ]
    })
    .overrideComponent(AvisosPage, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvisosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar avisos y sugerencias al inicializar', () => {
    expect(stateMock.cargarAvisos).toHaveBeenCalled();
    expect(stateMock.cargarSugerenciasCocina).toHaveBeenCalled();
  });

  it('debería delegar búsqueda al state', () => {
    component.onBuscar('Ajo');
    expect(stateMock.setSearchTerm).toHaveBeenCalledWith('Ajo');
  });

  it('debería abrir vencimiento modal si es tipo vencimiento', () => {
    component.abrirAviso(mockAvisoVencimiento);
    expect(component.vencimientoSeleccionado).toEqual(mockAvisoVencimiento);
  });

  it('debería navegar a aviso-vencimientos si es tipo vencimiento agrupado u otro (usando abrirVencimientos)', () => {
    const mockAgrupado: Aviso = { ...mockAvisoVencimiento, id: '3', tipo: 'vencimiento-agrupado' } as any;
    component.abrirAviso(mockAgrupado);
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff/gerente/aviso-vencimientos'], { queryParams: { avisoId: '3' } });
  });

  it('debería abrir el pedido offcanvas al abrirPedidoStock y seleccionar ingrediente', () => {
    component.abrirPedidoStock(mockAvisoStock);
    expect(component.stockAvisoSeleccionado).toEqual(mockAvisoStock);
    expect(component.isPedidoOffcanvasOpen).toBe(true);
    expect(pedidoStateMock.seleccionarIngredienteParaPedido).toHaveBeenCalled();
  });

  it('debería cerrar pedido stock', () => {
    component.isPedidoOffcanvasOpen = true;
    component.cerrarPedidoStock();
    expect(component.isPedidoOffcanvasOpen).toBe(false);
    expect(pedidoStateMock.limpiarSeleccion).toHaveBeenCalled();
  });

  it('debería confirmar pedido de stock, marcar revisado y navegar', () => {
    component.stockAvisoSeleccionado = mockAvisoStock;
    component.confirmarPedidoStock();
    
    expect(pedidoStateMock.crearPedidoPendiente).toHaveBeenCalled();
    expect(stateMock.marcarRevisado).toHaveBeenCalledWith('stock', '1');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff', 'gerente', 'ver-proveedores', 10, 'historial']);
  });

  it('debería alternar panel preview sistema', () => {
    component.abrirPreviewSugerencia('sistema');
    expect(component.panelPreviewAbierto()).toBe('sistema');
    expect(pedidoSugeridoStateMock.cargarDatos).toHaveBeenCalled();
  });

  it('debería alternar panel preview IA', () => {
    component.abrirPreviewSugerencia('ia');
    expect(component.panelPreviewAbierto()).toBe('ia');
    expect(stateMock.generarSugerenciasIA).toHaveBeenCalled();
  });

  it('debería navegar a crear plato al crearPlatoDesdeIA', () => {
    const platoSugerido: any = { nombre: 'Mila', descripcion: 'Desc', ingredientesSugeridos: [] };
    component.crearPlatoDesdeIA(platoSugerido);
    
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff/gerente/crear-plato'], expect.any(Object));
  });
});
