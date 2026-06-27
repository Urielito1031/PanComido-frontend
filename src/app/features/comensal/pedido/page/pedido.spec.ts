import { TestBed } from '@angular/core/testing';
import { Pedido } from './pedido';
import { Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { ComensalState } from '../../services/comensal-state';
import { ComandaState } from '../../services/comanda-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { PlatoService } from '../../services/plato.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('Pedido', () => {
  let component: Pedido;

  const routerMock = {
    navigate: vi.fn(),
  };

  const pedidoStateMock = {
    agregarPedido: vi.fn(),
  };

  const platoServiceMock = {
    getArticuloComensal: vi.fn().mockReturnValue(of({ id: 1, nombre: 'Pizza' })),
  };

  const comandaStateMock = {
    restauranteId: signal(1).asReadonly(),
    mesaId: signal(10).asReadonly(),
  };

  const comensalStateMock = {};

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
    vi.clearAllMocks();
    vi.spyOn(history, 'state', 'get').mockReturnValue({
      plato: { id: 1, nombre: 'Pizza', precio: 100 },
    });

    await TestBed.configureTestingModule({
      imports: [Pedido],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComensalState, useValue: comensalStateMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock },
        { provide: PlatoService, useValue: platoServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(Pedido);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería incrementar cantidad', () => {
    component.cantidad.set(1);
    component.incrementar();
    expect(component.cantidad()).toBe(2);
  });

  it('debería decrementar cantidad sin bajar de 1', () => {
    component.cantidad.set(1);
    component.decrementar();
    expect(component.cantidad()).toBe(1);

    component.cantidad.set(3);
    component.decrementar();
    expect(component.cantidad()).toBe(2);
  });

  it('debería agregar al pedido y navegar', () => {
    component.plato = { id: 1, nombre: 'Pizza', precio: 100 } as any;

    component.agregarAlPedido();

    expect(pedidoStateMock.agregarPedido).toHaveBeenCalledWith({
      plato: component.plato,
      cantidad: 1,
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/detalle-pedido']);
  });

  it('debería navegar a personalizar plato', () => {
    component.plato = { id: 1, nombre: 'Pizza', precio: 100 } as any;
    component.cantidad.set(2);

    component.irAPersonalizar();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/comensal/personalizar-plato'],
      { state: { plato: { plato: component.plato, cantidad: 2 } } },
    );
  });

  it('no debería agregar al pedido si no hay plato', () => {
    component.plato = null;
    component.agregarAlPedido();
    expect(pedidoStateMock.agregarPedido).not.toHaveBeenCalled();
  });
});
