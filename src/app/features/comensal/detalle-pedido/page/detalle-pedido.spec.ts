import { TestBed } from '@angular/core/testing';
import { DetallePedido } from './detalle-pedido';
import { Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
import { vi } from 'vitest';

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
    await TestBed.configureTestingModule({
      imports: [DetallePedido],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ComensalState, useValue: comensalStateMock }
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