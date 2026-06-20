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
      expect(state.restauranteId()).toBeNull();
      expect(state.comandaId()).toBeNull();
      expect(state.mesaId()).toBeNull();
      expect(state.mesaInfo()).toBeNull();
      expect(state.estadoPedido()).toBeNull();
      expect(state.cargando()).toBe(false);
      expect(state.error()).toBeNull();
      expect(state.tieneComandaActiva()).toBe(false);
    });

    it('deberia leer restauranteId, comandaId y mesaId desde sessionStorage', () => {
      sessionStorage.setItem('restauranteId', '3');
      sessionStorage.setItem('comandaId', '10');
      sessionStorage.setItem('mesaId', '7');

      TestBed.resetTestingModule();
      configurarTest();

      expect(state.restauranteId()).toBe(3);
      expect(state.comandaId()).toBe(10);
      expect(state.mesaId()).toBe(7);
      expect(state.tieneComandaActiva()).toBe(true);
    });

    it('deberia ignorar sessionStorage con valores invalidos', () => {
      sessionStorage.setItem('restauranteId', 'NO-ES-NUMERO');

      TestBed.resetTestingModule();
      configurarTest();

      expect(state.restauranteId()).toBeNull();
    });
  });



  describe('iniciarEscucha / detenerEscucha', () => {
    it('deberia conectar al hub como comensal con el mesaId', async () => {
      await state.iniciarEscucha(5);
      expect(comandaHubMock.conectarComoComensal).toHaveBeenCalledWith(5);
    });

    it('deberia desconectar la escucha del hub', () => {
      state.detenerEscucha();
      expect(comandaHubMock.desconectarEscucha).toHaveBeenCalled();
    });
  });


  describe('ocuparMesa', () => {
    it('deberia ocupar mesa y actualizar todas las signals', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));

      await firstValueFrom(state.ocuparMesa(5, 4, 3));

      expect(comandaServiceMock.ocuparMesa).toHaveBeenCalledWith(3, 5, 4);
      expect(state.restauranteId()).toBe(3);
      expect(state.mesaId()).toBe(5);
      expect(state.comandaId()).toBe(42);
      expect(state.mesaInfo()?.id).toBe(5);
      expect(state.cargando()).toBe(false);
      expect(state.error()).toBeNull();
      expect(state.tieneComandaActiva()).toBe(true);
    });

    it('deberia guardar en sessionStorage', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));

      await firstValueFrom(state.ocuparMesa(5, 4, 3));

      expect(sessionStorage.getItem('restauranteId')).toBe('3');
      expect(sessionStorage.getItem('comandaId')).toBe('42');
      expect(sessionStorage.getItem('mesaId')).toBe('5');
    });

    it('deberia manejar error y setear mensaje en error signal', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(throwError(() => new Error('Network error')));

      try {
        await firstValueFrom(state.ocuparMesa(5, 4, 3));
        expect.fail('Debería haber fallado');
      } catch {
        expect(state.error()).toBe('No se pudo ocupar la mesa. Intenta nuevamente.');
        expect(state.cargando()).toBe(false);
        expect(state.restauranteId()).toBeNull();
        expect(state.comandaId()).toBeNull();
      }
    });
  });


  describe('confirmarPedido', () => {
    beforeEach(async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));
      await firstValueFrom(state.ocuparMesa(5, 4, 3));
    });

    it('deberia confirmar pedido, actualizar estado y limpiar carrito', () => {
      pedidoStateMock.obtenerPedidos.mockReturnValue([itemPedidoMock]);
      comandaServiceMock.confirmarPedido.mockReturnValue(of(comandaClienteResponseMock));

      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).toHaveBeenCalledWith(42, 3, {
        items: [
          {
            articuloId: 1,
            cantidad: 2,
            observacionesIngredientes: null,
            observacionesGenerales: null,
          },
        ],
      });
      expect(state.estadoPedido()?.comandaId).toBe(42);
      expect(state.estadoPedido()?.totalAPagar).toBe(2500);
      expect(state.estadoPedido()?.items.length).toBe(1);
      expect(state.cargando()).toBe(false);
      expect(pedidoStateMock.limpiarPedidos).toHaveBeenCalled();
    });

    it('deberia incluir observaciones en los items del pedido', () => {
      const itemConObs: ItemPedido = {
        ...itemPedidoMock,
        observacionesIngredientes: 'Sin cebolla',
        observacionesGenerales: 'Bien cocido',
      };
      pedidoStateMock.obtenerPedidos.mockReturnValue([itemConObs]);
      comandaServiceMock.confirmarPedido.mockReturnValue(of(comandaClienteResponseMock));

      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).toHaveBeenCalledWith(42, 3, {
        items: [
          {
            articuloId: 1,
            cantidad: 2,
            observacionesIngredientes: 'Sin cebolla',
            observacionesGenerales: 'Bien cocido',
          },
        ],
      });
    });

    it('deberia mostrar error si la API falla', () => {
      pedidoStateMock.obtenerPedidos.mockReturnValue([itemPedidoMock]);
      comandaServiceMock.confirmarPedido.mockReturnValue(throwError(() => new Error('Error')));

      state.confirmarPedido();

      expect(state.error()).toBe('Error al confirmar el pedido. Intenta nuevamente.');
      expect(state.cargando()).toBe(false);
    });
  });

  describe('confirmarPedido — guardas', () => {
    it('NO deberia confirmar si no hay comanda activa', () => {
      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).not.toHaveBeenCalled();
      expect(state.error()).toBe('No hay comanda activa. Escanea el QR de la mesa.');
    });

    it('NO deberia confirmar si el carrito esta vacio', async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));
      await firstValueFrom(state.ocuparMesa(5, 4, 3));

      pedidoStateMock.obtenerPedidos.mockReturnValue([]);

      state.confirmarPedido();

      expect(comandaServiceMock.confirmarPedido).not.toHaveBeenCalled();
      expect(state.error()).toBe('El carrito está vacío');
    });
  });


  describe('consultarEstado', () => {
    beforeEach(async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));
      await firstValueFrom(state.ocuparMesa(5, 4, 3));
    });

    it('deberia consultar y actualizar estadoPedido', () => {
      comandaServiceMock.obtenerEstado.mockReturnValue(of(comandaClienteResponseMock));

      state.consultarEstado();

      expect(comandaServiceMock.obtenerEstado).toHaveBeenCalledWith(42, 3);
      expect(state.estadoPedido()?.comandaId).toBe(42);
      expect(state.estadoPedido()?.totalAPagar).toBe(2500);
    });

    it('NO deberia consultar si no hay comandaId', () => {
      sessionStorage.clear(); 
      TestBed.resetTestingModule();
      configurarTest();

      state.consultarEstado();

      expect(comandaServiceMock.obtenerEstado).not.toHaveBeenCalled();
    });
  });


  describe('limpiarEstado', () => {
    beforeEach(async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));
      await firstValueFrom(state.ocuparMesa(5, 4, 3));
    });

    it('deberia resetear todas las signals', () => {
      state.limpiarEstado();

      expect(state.restauranteId()).toBeNull();
      expect(state.comandaId()).toBeNull();
      expect(state.mesaId()).toBeNull();
      expect(state.mesaInfo()).toBeNull();
      expect(state.estadoPedido()).toBeNull();
      expect(state.error()).toBeNull();
      expect(state.tieneComandaActiva()).toBe(false);
    });

    it('deberia limpiar sessionStorage', () => {
      state.limpiarEstado();

      expect(sessionStorage.getItem('restauranteId')).toBeNull();
      expect(sessionStorage.getItem('comandaId')).toBeNull();
      expect(sessionStorage.getItem('mesaId')).toBeNull();
    });
  });


  describe('limpiarError', () => {
    it('deberia limpiar solo el error', () => {
      state.confirmarPedido(); // Fuerza un error al no tener comanda activa
      expect(state.error()).toBeTruthy();

      state.limpiarError();

      expect(state.error()).toBeNull();
    });
  });


  describe('efecto del constructor (comandaModificada)', () => {
    beforeEach(async () => {
      comandaServiceMock.ocuparMesa.mockReturnValue(of(mesaOcuparResponseMock));
      await firstValueFrom(state.ocuparMesa(5, 4, 3));
    });

    it('deberia llamar a consultarEstado cuando el hub emite una comanda', () => {
      comandaServiceMock.obtenerEstado.mockReturnValue(of(comandaClienteResponseMock));

      // Simulamos que el socket escupe una data y actualiza el signal
      comandaHubMock.comandaModificada.set({ id: 42 } as Comanda);

      TestBed.flushEffects();

      expect(comandaServiceMock.obtenerEstado).toHaveBeenCalledWith(42, 3);
      expect(state.estadoPedido()?.totalAPagar).toBe(2500);
    });

    it('NO deberia hacer nada si el hub emite null', () => {
      comandaHubMock.comandaModificada.set(null);

      TestBed.flushEffects();

      expect(comandaServiceMock.obtenerEstado).not.toHaveBeenCalled();
    });
  });
});
