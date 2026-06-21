import { TestBed } from '@angular/core/testing';
import { DetallePedido } from './detalle-pedido';
import { Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
<<<<<<< HEAD
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
=======
import { vi } from 'vitest';
>>>>>>> origin/vista-comensal-nueva

describe('DetallePedido', () => {
  let component: DetallePedido;

  const routerMock = {
    navigate: vi.fn()
  };

  const pedidoStateMock = {
    pedidos: () => [
      {
        cantidad: 2,
        plato: { precioVentaFinal: 100 }
      }
    ]
  };

  const comandaStateMock = {
    comandaId: vi.fn(() => 1),
    estadoPedido: vi.fn(() => ({
      totalAPagar: 50
    }))
  };

  const comensalStateMock = {};

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
        }
      ])
    };

    comandaStateMock = {
      estadoPedido: signal({
        totalAPagar: 300,
        items: []
      }),
      tieneComandaActiva: vi.fn().mockReturnValue(true),
      mesaId: signal(1),
      restauranteId: signal(1),
      cargando: signal(false),
      error: signal(null),
      confirmarPedido: vi.fn()
    };

    comensalStateMock = {
      enviando: signal(false),
      exito: signal(false),
      error: signal(null),
      solicitarMozo: vi.fn(),
      limpiarEstado: vi.fn()
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
      imports: [DetallePedido],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ComensalState, useValue: comensalStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(DetallePedido);
    component = fixture.componentInstance;

    // mock modal ViewChild
    component.modal = {
      mostrar: vi.fn()
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería calcular el total correctamente', () => {
    expect(component.total()).toBe(250);
  });

  it('debería volver al pedido', () => {
    component.volver();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/pedido'
    ]);
  });

  it('debería abrir modal al confirmar pedido', () => {
    component.confirmarPedido();

    expect(component.modal.mostrar).toHaveBeenCalled();
  });


  it('debería navegar a editar item', () => {
    const item = {
      cantidad: 1,
      plato: { precioVentaFinal: 50 }
    } as any;

    component.editarItem(item);

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/comensal/personalizar-plato'],
      {
        state: { plato: item }
      }
    );
  });
});