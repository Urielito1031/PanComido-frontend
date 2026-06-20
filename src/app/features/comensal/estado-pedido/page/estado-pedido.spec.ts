import { TestBed } from '@angular/core/testing';
import { EstadoPedido } from './estado-pedido';
import { Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
import { vi } from 'vitest';

describe('EstadoPedido', () => {
  let component: EstadoPedido;

  const routerMock = {
    navigate: vi.fn()
  };

  const estadoMock = {
    estadoUI: 'En preparación'
  };

  const comandaStateMock = {
    estadoPedido: vi.fn(() => estadoMock),
    mesaId: vi.fn(() => 10),
    restauranteId: vi.fn(() => 1),
    cargando: false,
    error: null,
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
      '/comensal/ver-carta',
      1,
      10,
      1
    ]);
  });

  it('debería navegar a pago checkout', () => {
    component.pagarCuenta();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/pago-checkout'
    ]);
  });

  it('debería calcular color de estado preparación', () => {
    expect(component.estadoColor).toBe('#ebd038');
  });

  it('debería calcular color de estado listo', () => {
    comandaStateMock.estadoPedido.mockReturnValue({
      estadoUI: 'Listo para servir'
    });

    expect(component.estadoColor).toBe('#6bb446');
  });

  it('debería color gris por defecto', () => {
    comandaStateMock.estadoPedido.mockReturnValue({
      estadoUI: 'Otro estado'
    });

    expect(component.estadoColor).toBe('#a3a3a3');
  });


});