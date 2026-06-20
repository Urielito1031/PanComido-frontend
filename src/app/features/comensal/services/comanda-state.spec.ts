import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ComandaState } from './comanda-state';
import { ComandaService } from './comanda.service';
import { PedidoState } from './pedido.state';
import { ComandaHubService } from '../../../core/services/hubs/comanda/comanda-hub-service';
import { Comanda, EstadoPedido } from '../../../core/models/domain/comanda';
import { MesaOcuparResponse } from '../../../core/models/dtos/responses/mesa-ocupar.response';
import { ComandaClienteResponse } from '../../../core/models/dtos/responses/comanda-cliente.response';
import { ItemPedido } from '../../../core/models/domain/item-pedido';

describe('ComandaState (comensal)', () => {
  let state: ComandaState;
  let comandaServiceMock: any;
  let pedidoStateMock: any;
  let comandaHubMock: any;

  const mesaOcuparResponseMock: MesaOcuparResponse = {
    idComandaGenerada: 42,
    mesa: {
      id: 5,
      codigoInvitacion: 'ABC123',
      cantidadPersonasMax: 4,
      numeroMesa: 5,
      posicionXInicio: 0,
      posicionXFin: 100,
      posicionYInicio: 0,
      posicionYFin: 100,
      dimensionMesa: { id: 1, forma: 'cuadrada' },
      estadoMesa: 'Ocupada',
    },
  };

  const comandaClienteResponseMock: ComandaClienteResponse = {
    comandaId: 42,
    estadoUI: 'EnPreparacion',
    totalAPagar: 2500,
    items: [
      {
        articuloId: 1,
        nombre: 'Milanesa napolitana',
        cantidad: 2,
        entregado: false,
        precioUnitario: 800,
        subtotal: 1600,
        observacionesIngredientes: null,
        observacionesGenerales: null,
      },
    ],
  };

  const itemPedidoMock: ItemPedido = {
    plato: {
      articuloId: 1,
      nombre: 'Milanesa napolitana',
      urlImagen: null,
      precioVentaFinal: 800,
      costo: 400,
      visibleEnCarta: true,
      tipoArticulo: 'Plato',
      categoria: 'Principales',
      restricciones: [],
    },
    cantidad: 2,
  };

  function configurarTest() {
    comandaServiceMock = {
      ocuparMesa: vi.fn(),
      confirmarPedido: vi.fn(),
      obtenerEstado: vi.fn(),
    };

    pedidoStateMock = {
      obtenerPedidos: vi.fn(),
      limpiarPedidos: vi.fn(),
    };

    comandaHubMock = {
      comandaModificada: signal<Comanda | null>(null),
      conectarComoComensal: vi.fn().mockResolvedValue(undefined),
      desconectarEscucha: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ComandaState,
        { provide: ComandaService, useValue: comandaServiceMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComandaHubService, useValue: comandaHubMock },
      ],
    });

    state = TestBed.inject(ComandaState);
  }

  beforeEach(() => {
    sessionStorage.clear();
    configurarTest();
  });

  describe('inicializacion', () => {
    it('deberia arrancar con valores por defecto', () => {
      expect(state.cargando()).toBe(false);
      expect(state.error()).toBeNull();
    });

    it('deberia leer sessionStorage (estado real actual)', () => {
      sessionStorage.setItem('restauranteId', '3');
      sessionStorage.setItem('comandaId', '10');
      sessionStorage.setItem('mesaId', '7');

      TestBed.resetTestingModule();
      configurarTest();

      expect(state.restauranteId()).toBe(3);
      expect(state.comandaId()).toBe(10);
      expect(state.mesaId()).toBe(7);
    });

    it('deberia ignorar sessionStorage invalido', () => {
      sessionStorage.setItem('restauranteId', 'NO-ES-NUMERO');

      TestBed.resetTestingModule();
      configurarTest();

      expect(state.restauranteId()).toBeNull();
    });
  });

  describe('iniciarEscucha / detenerEscucha', () => {
    it('deberia conectar hub', async () => {
      await state.iniciarEscucha(5);
      expect(comandaHubMock.conectarComoComensal).toHaveBeenCalledWith(5);
    });

    it('deberia desconectar hub', () => {
      state.detenerEscucha();
      expect(comandaHubMock.desconectarEscucha).toHaveBeenCalled();
    });
  });

  describe('ocuparMesa', () => {
    it('deberia ocupar mesa y actualizar signals', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));

      await firstValueFrom(state.ocuparMesa(5, 4, 3, "maria"));

      expect(state.comandaId()).toBe(42);
      expect(state.mesaId()).toBe(4);
      expect(state.restauranteId()).toBe(5);
    });

    it('deberia guardar sessionStorage', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));

      await firstValueFrom(state.ocuparMesa(5, 4, 3, "maria"));

      expect(sessionStorage.getItem('restauranteId')).toBe('5');
      expect(sessionStorage.getItem('comandaId')).toBe('42');
      expect(sessionStorage.getItem('mesaId')).toBe('4');
    });

    it('deberia setear error pero NO limpiar estado (comportamiento actual)', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      try {
        await firstValueFrom(state.ocuparMesa(5, 4, 3, "maria"));
      } catch {}

      expect(state.error()).toBe('No se pudo ocupar la mesa. Intenta nuevamente.');
      expect(state.restauranteId()).toBe(5);
      expect(state.mesaId()).toBe(4);
    });
  });

  describe('confirmarPedido', () => {
    beforeEach(async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));
      await firstValueFrom(state.ocuparMesa(5, 4, 3, "maria"));
    });

    it('deberia confirmar pedido (incluye nombreComensal)', () => {
      pedidoStateMock.obtenerPedidos.mockReturnValue([itemPedidoMock]);
      comandaServiceMock.confirmarPedido.mockReturnValue(of(comandaClienteResponseMock));

      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).toHaveBeenCalledWith(
        42,
        5,
        {
          items: [
            {
              articuloId: 1,
              cantidad: 2,
              observacionesIngredientes: null,
              observacionesGenerales: null,
            }
          ],
          nombreComensal: ''
        }
      );

      expect(state.estadoPedido()?.comandaId).toBe(42);
    });

    it('deberia incluir observaciones', () => {
      const item = {
        ...itemPedidoMock,
        observacionesIngredientes: 'Sin cebolla',
        observacionesGenerales: 'Bien cocido'
      };

      pedidoStateMock.obtenerPedidos.mockReturnValue([item]);
      comandaServiceMock.confirmarPedido.mockReturnValue(of(comandaClienteResponseMock));

      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).toHaveBeenCalledWith(
        42,
        5,
        expect.objectContaining({
          items: [
            expect.objectContaining({
              observacionesIngredientes: 'Sin cebolla',
              observacionesGenerales: 'Bien cocido'
            })
          ]
        })
      );
    });

    it('deberia error si falla API', () => {
      pedidoStateMock.obtenerPedidos.mockReturnValue([itemPedidoMock]);
      comandaServiceMock.confirmarPedido.mockReturnValue(
        throwError(() => new Error('Error'))
      );

      state.confirmarPedido();

      expect(state.error()).toBe('Error al confirmar el pedido. Intenta nuevamente.');
    });

    it('no deberia confirmar sin comanda', () => {
      state.limpiarEstado();
      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).not.toHaveBeenCalled();
    });

    it('no deberia confirmar carrito vacío', () => {
      pedidoStateMock.obtenerPedidos.mockReturnValue([]);
      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).not.toHaveBeenCalled();
    });
  });

  describe('consultarEstado', () => {
    it('deberia consultar estado si hay comanda', () => {
      comandaServiceMock.obtenerEstado.mockReturnValue(of(comandaClienteResponseMock));

      state.setComandaDesdeSesion({
        comandaId: 42,
        restauranteId: 5,
        mesaId: 4
      });

      state.consultarEstado();

      expect(comandaServiceMock.obtenerEstado).toHaveBeenCalledWith(42, 5);
    });
  });

  describe('limpiarEstado', () => {
    it('deberia limpiar todo', () => {
      state.limpiarEstado();

      expect(state.comandaId()).toBeNull();
      expect(state.restauranteId()).toBeNull();
      expect(state.mesaId()).toBeNull();
    });
  });

  
});