import { TestBed } from '@angular/core/testing';
import { DetallePedido } from './detalle-pedido';
import { Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('DetallePedido', () => {
  let component: DetallePedido;

  const routerMock = {
    navigate: vi.fn()
  };

  const pedidoStateMock = {
    pedidos: signal([
      { plato: { precio: 100 }, cantidad: 2 },
      { plato: { precio: 50 }, cantidad: 1 },
    ]).asReadonly(),
    eliminarPedido: vi.fn(),
    incrementarCantidad: vi.fn(),
    decrementarCantidad: vi.fn(),
  };

  const comandaStateMock = {
    comandaId: signal(1).asReadonly(),
    mesaId: signal(1).asReadonly(),
    restauranteId: signal(1).asReadonly(),
    estadoPedido: signal<{ totalAPagar: number; items: any[]; estadoUI?: string } | null>(null).asReadonly(),
    cargando: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    tieneComandaActiva: vi.fn(() => true),
    confirmarPedido: vi.fn(),
    consultarEstado: vi.fn(),
    iniciarEscucha: vi.fn().mockResolvedValue(undefined),
    detenerEscucha: vi.fn(),
  };

  const comensalStateMock = {
    enviando: signal(false).asReadonly(),
    exito: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    solicitarMozo: vi.fn(),
    limpiarEstado: vi.fn(),
  };

  const configuracionVisualStateMock = {
    colorPrimario: vi.fn().mockReturnValue('#000000'),
    colorSecundario: vi.fn().mockReturnValue('#FFFFFF'),
    nombreLocal: vi.fn().mockReturnValue(''),
    logoUrl: vi.fn().mockReturnValue(null),
    fontTitulo: vi.fn().mockReturnValue(''),
    fontCuerpo: vi.fn().mockReturnValue(''),
    cargar: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePedido],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ComensalState, useValue: comensalStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DetallePedido);
    component = fixture.componentInstance;
    component.modal = { mostrar: vi.fn() } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería calcular el total correctamente', () => {
    expect(component.total()).toBe(250);
  });

  it('debería volver al pedido', () => {
    component.volver();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/pedido']);
  });

  it('debería abrir modal al confirmar pedido', () => {
    component.confirmarPedido();

    expect(component.modal.mostrar).toHaveBeenCalled();
  });

  it('debería navegar a editar item', () => {
    const item = { cantidad: 1, plato: { precio: 50 } } as any;

    component.editarItem(item, 0);

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/comensal/personalizar-plato'],
      { state: { plato: item, index: 0 } },
    );
  });

  it('debería eliminar item del pedido', () => {
    component.eliminarItem(0);

    expect(pedidoStateMock.eliminarPedido).toHaveBeenCalledWith(0);
  });

  it('debería incrementar cantidad', () => {
    component.incrementarCantidad(1);

    expect(pedidoStateMock.incrementarCantidad).toHaveBeenCalledWith(1);
  });

  it('debería decrementar cantidad', () => {
    component.decrementarCantidad(2);

    expect(pedidoStateMock.decrementarCantidad).toHaveBeenCalledWith(2);
  });
});
