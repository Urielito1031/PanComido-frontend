import { TestBed } from '@angular/core/testing';
import { Pedido } from './pedido';
import { Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { ComensalState } from '../../services/comensal-state';
import { ComandaState } from '../../services/comanda-state';
<<<<<<< HEAD
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
=======
import { of } from 'rxjs';
import { vi } from 'vitest';
>>>>>>> origin/vista-comensal-nueva

describe('Pedido', () => {
  let component: Pedido;

  const routerMock = {
    navigate: vi.fn()
  };

  const pedidoStateMock = {
    pedidos: () => [
      {
        cantidad: 2,
        plato: { precioVentaFinal: 100 }
      }
    ],
    eliminarPedido: vi.fn(),
    incrementarCantidad: vi.fn(),
    decrementarCantidad: vi.fn()
  };

  const comensalStateMock = {};
  const comandaStateMock = {
    restauranteId: () => 1,
    mesaId: () => 10
  };

  beforeEach(async () => {
<<<<<<< HEAD
    routerMock = {
      navigate: vi.fn()
    };

    pedidoStateMock = {
      pedidos: signal([
        {
          plato: {
            precioVentaFinal: 100
          },
          cantidad: 2
        },
        {
          plato: {
            precioVentaFinal: 50
          },
          cantidad: 1
        }
      ]),
      eliminarPedido: vi.fn(),
      incrementarCantidad: vi.fn(),
      decrementarCantidad: vi.fn()
    };

    comensalStateMock = {
      enviando: signal(false),
      exito: signal(false),
      error: signal(null),
      solicitarMozo: vi.fn(),
      limpiarEstado: vi.fn()
    };
    comandaStateMock = {
      mesaId: signal(1),
      restauranteId: signal(1),
      cargando: signal(false),
      error: signal(null),
      estadoPedido: signal(null),
      confirmarPedido: vi.fn()
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

=======
>>>>>>> origin/vista-comensal-nueva
    await TestBed.configureTestingModule({
      imports: [Pedido],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComensalState, useValue: comensalStateMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(Pedido);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería calcular el total correctamente', () => {
    expect(component.total()).toBe(200);
  });

  it('debería navegar a detalle pedido', () => {
    component.irADetallePedido();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/detalle-pedido'
    ]);
  });

  it('debería volver a ver carta', () => {
    component.volver();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/ver-carta',
      1,
      10,
      1
    ]);
  });

  it('debería eliminar pedido', () => {
    component.eliminarPedido(0);

    expect(pedidoStateMock.eliminarPedido).toHaveBeenCalledWith(0);
  });

  it('debería incrementar cantidad', () => {
    component.agregarAlPedido(0);

    expect(pedidoStateMock.incrementarCantidad).toHaveBeenCalledWith(0);
  });

  it('debería decrementar cantidad', () => {
    component.eliminarUno(0);

    expect(pedidoStateMock.decrementarCantidad).toHaveBeenCalledWith(0);
  });

  it('debería navegar a personalizar plato', () => {
    const item = {
      cantidad: 1,
      plato: { precioVentaFinal: 50 }
    } as any;

    component.irAPersonalizar(item, 0);

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/comensal/personalizar-plato'],
      {
        state: { plato: item, index: 0 }
      }
    );
  });
});