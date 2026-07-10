import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { RecepcionPedidoModalComponent } from './recepcion-pedido-modal';
import { VerProveedoresState } from '../../services/ver-proveedores.state';
import { PedidoProveedor } from '../../../../../core/models/domain/proveedor';

describe('RecepcionPedidoModalComponent', () => {
  let component: RecepcionPedidoModalComponent;
  let stateMock: any;

  const mockPedido: PedidoProveedor = {
    id: 101,
    fecha: '2026-05-18T09:00:00.000Z',
    concepto: 'Pedido de carnes y verduras',
    monto: 184500,
    estado: 'Enviado',
    observacion: '',
    items: []
  };

  beforeEach(() => {
    stateMock = {
      recepcionPedido: signal(mockPedido),
      recepcionItems: signal([]),
      bodegas: signal([]),
      cerrarRecepcion: vi.fn(),
      actualizarRecepcionItem: vi.fn(),
      recibirPedido: vi.fn()
    };

    TestBed.configureTestingModule({
      imports: [RecepcionPedidoModalComponent],
      providers: [{ provide: VerProveedoresState, useValue: stateMock }]
    });

    const fixture = TestBed.createComponent(RecepcionPedidoModalComponent);
    component = fixture.componentInstance;
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería llamar a state.cerrarRecepcion', () => {
    component.cerrarRecepcion();
    expect(stateMock.cerrarRecepcion).toHaveBeenCalled();
  });

  it('debería llamar a state.recibirPedido', () => {
    component.recibirPedido();
    expect(stateMock.recibirPedido).toHaveBeenCalled();
  });

  it('debería actualizar la cantidad con un numero valido', () => {
    component.actualizarCantidadRecepcion(6, '10');
    expect(stateMock.actualizarRecepcionItem).toHaveBeenCalledWith(6, { cantidad: 10 });
  });

  it('no debería actualizar la cantidad con un valor invalido', () => {
    component.actualizarCantidadRecepcion(6, 'abc');
    expect(stateMock.actualizarRecepcionItem).not.toHaveBeenCalled();
  });

  it('debería actualizar el precio con un numero valido', () => {
    component.actualizarPrecioRecepcion(6, '18450');
    expect(stateMock.actualizarRecepcionItem).toHaveBeenCalledWith(6, { precioUnitario: 18450 });
  });

  it('debería actualizar la fecha de vencimiento', () => {
    component.actualizarFechaRecepcion(6, '2026-06-01');
    expect(stateMock.actualizarRecepcionItem).toHaveBeenCalledWith(6, { fechaVencimiento: '2026-06-01' });
  });

  it('debería actualizar la bodega', () => {
    component.actualizarBodegaRecepcion(6, '2');
    expect(stateMock.actualizarRecepcionItem).toHaveBeenCalledWith(6, { bodegaId: 2 });
  });
});
