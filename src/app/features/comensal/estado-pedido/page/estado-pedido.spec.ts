import { TestBed } from '@angular/core/testing';
import { EstadoPedido } from './estado-pedido';
import { Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('EstadoPedido', () => {
  let component: EstadoPedido;
  const estadoSignal = signal<{ estadoUI: string } | null>({ estadoUI: 'En preparación' });

  const routerMock = {
    navigate: vi.fn()
  };

  const comandaStateMock = {
    estadoPedido: estadoSignal.asReadonly(),
    mesaId: signal(10).asReadonly(),
    restauranteId: signal(1).asReadonly(),
    cargando: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
    consultarEstado: vi.fn(),
    iniciarEscucha: vi.fn().mockResolvedValue(undefined),
    detenerEscucha: vi.fn()
  };

  const comensalStateMock = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadoPedido],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ComensalState, useValue: comensalStateMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(EstadoPedido);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería iniciar escucha si hay mesaId', async () => {
    component.ngOnInit();

    expect(comandaStateMock.iniciarEscucha).toHaveBeenCalledWith(10);
  });

  it('debería detener escucha en destroy', () => {
    component.ngOnDestroy();

    expect(comandaStateMock.detenerEscucha).toHaveBeenCalled();
  });

  it('debería navegar a ver carta', () => {
    component.volver();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/ver-carta'
    ]);
  });

  it('debería navegar a pago checkout', () => {
    component.pagarCuenta();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/pago-checkout'
    ]);
  });

  it('debería consultar estado si no hay pedido cargado', () => {
    estadoSignal.set(null);
    component.ngOnInit();

    expect(comandaStateMock.consultarEstado).toHaveBeenCalled();
  });

  it('no debería consultar estado si ya hay pedido cargado', () => {
    comandaStateMock.consultarEstado.mockClear();
    estadoSignal.set({ estadoUI: 'Listo para servir' });
    component.ngOnInit();

    expect(comandaStateMock.consultarEstado).not.toHaveBeenCalled();
  });

  it('debería exponer las signals del estado de comanda', () => {
    estadoSignal.set({ estadoUI: 'Otro estado' });

    expect(component.estado()).toEqual({ estadoUI: 'Otro estado' });
    expect(component.mesaId()).toBe(10);
  });
});
