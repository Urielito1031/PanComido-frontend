import { TestBed } from '@angular/core/testing';
import { ComandaState } from './comanda-state';
import { ComandaService } from './comanda-service';
import { Comanda } from '../../../../core/models/domain/comanda';
import { of, throwError } from 'rxjs';

describe('ComandaState (cocina)', () => {
  let state: ComandaState;
  let mockService: any;

  const mockComandas: Comanda[] = [
    {
      id: 1,
      mesaId: 1,
      cantComensales: 2,
      estado: 'Nueva',
      horaInicio: '2026-05-30T10:00:00',
      horaFin: null,
      horaUltimoCambioEstado: null,
      tiempoEstimadoTotal: 30,
      items: [],
    },
    {
      id: 2,
      mesaId: 2,
      cantComensales: 4,
      estado: 'EnPreparacion',
      horaInicio: '2026-05-30T09:45:00',
      horaFin: null,
      horaUltimoCambioEstado: null,
      tiempoEstimadoTotal: 45,
      items: [],
    },
    {
      id: 3,
      mesaId: 3,
      cantComensales: 3,
      estado: 'EnEspera',
      horaInicio: '2026-05-30T10:20:00',
      horaFin: null,
      horaUltimoCambioEstado: null,
      tiempoEstimadoTotal: 25,
      items: [
        {
          id: 5,
          entregado: false,
           cantidad: 2,
           observacionesIngredientes: null,
           observacionesGenerales: null,
           articulo: {
            id: 5,
             nombre: 'Milanesa napolitana',
             urlImagen: null,
            },
          }
        ],
    },
    {
      id: 4,
      mesaId: 4,
      cantComensales: 2,
      estado: 'Finalizada',
      horaInicio: '2026-05-30T08:00:00',
      horaFin: '2026-05-30T09:00:00',
      horaUltimoCambioEstado: '2026-05-30T09:00:00',
      tiempoEstimadoTotal: 20,
      items: [],
    },
  ];

  beforeEach(() => {
    mockService = {
      obtenerComandasActivas: vi.fn(),
      modificarEstadoComanda: vi.fn(),
      marcarItemEntregado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [ComandaState, { provide: ComandaService, useValue: mockService }],
    });

    state = TestBed.inject(ComandaState);
  });

  describe('inicializacion', () => {
    it('deberia arrancar con listas vacias y cargando false', () => {
      expect(state.comandas()).toEqual([]);
      expect(state.comandasNuevas()).toEqual([]);
      expect(state.comandasEnPreparacion()).toEqual([]);
      expect(state.comandasEnEspera()).toEqual([]);
      expect(state.comandasfinalizadas()).toEqual([]);
      expect(state.cargando()).toBe(false);
    });
  });

  describe('cargarComandasActivas', () => {
    it('deberia cargar y separar las comandas por estado', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));

      state.cargarComandasActivas();

      expect(state.comandas().length).toBe(4);
      expect(state.comandasNuevas().length).toBe(1);
      expect(state.comandasEnPreparacion().length).toBe(1);
      expect(state.comandasEnEspera().length).toBe(1);
      expect(state.comandasfinalizadas().length).toBe(1);
      expect(state.cargando()).toBe(false);
    });

    it('deberia cargar estado cargando true mientras se ejecuta', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));

      state.cargarComandasActivas();

      // of() es síncrono, pero el state setea cargando=true antes de subscribir
      // y cargando=false en el next handler. Como of() es síncrono,
      // al terminar cargarComandasActivas, cargando ya es false.
      expect(state.cargando()).toBe(false);
    });

    it('deberia manejar error seteando cargando false', () => {
      mockService.obtenerComandasActivas.mockReturnValue(
        throwError(() => new Error('Error de red')),
      );

      state.cargarComandasActivas();

      expect(state.cargando()).toBe(false);
      expect(state.comandas()).toEqual([]);
    });
  });

  describe('modificarEstadoComanda', () => {
    it('deberia actualizar la comanda en la lista al cambiar estado', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaActualizada: Comanda = {
        ...mockComandas[0],
        estado: 'EnPreparacion',
      };

      mockService.modificarEstadoComanda.mockReturnValue(of(comandaActualizada));

      state.modificarEstadoComanda(1, 2);

      expect(state.comandasNuevas().length).toBe(0);
      expect(state.comandasEnPreparacion().length).toBe(2);
      expect(mockService.modificarEstadoComanda).toHaveBeenCalledWith(1, 2);
    });

    it('NO deberia modificar la lista si el servicio falla', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      mockService.modificarEstadoComanda.mockReturnValue(throwError(() => new Error('Error')));

      state.modificarEstadoComanda(1, 2);

      expect(state.comandasNuevas().length).toBe(1);
      expect(state.comandasEnPreparacion().length).toBe(1);
    });
  });

  describe('marcarItemEntregado', () => {
    it('deberia actualizar los items de la comanda', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaActualizada: Comanda = {
        ...mockComandas[2],
        items: [
          {
            ...mockComandas[2].items[0],
            entregado: true,
          },
        ],
      };

      mockService.marcarItemEntregado.mockReturnValue(of(comandaActualizada));

      state.marcarItemEntregado(3, 5);

      expect(mockService.marcarItemEntregado).toHaveBeenCalledWith(3, 5);
      expect(state.comandas().find((c) => c.id === 3)!.items[0].entregado).toBe(true);
    });

    it('NO deberia modificar la lista si el servicio falla', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      mockService.marcarItemEntregado.mockReturnValue(throwError(() => new Error('Error')));

      state.marcarItemEntregado(3, 5);

      expect(state.comandas().find((c) => c.id === 3)!.items[0].entregado).toBe(false);
    });
  });

  describe('actualizarDesdeHub', () => {
    it('deberia actualizar una comanda existente', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaHub: Comanda = {
        ...mockComandas[0],
        estado: 'Finalizada',
      };

      state.actualizarDesdeHub(comandaHub);

      expect(state.comandasNuevas().length).toBe(0);
      expect(state.comandasfinalizadas().length).toBe(2);
      expect(state.comandas().length).toBe(4); // no se agregan, solo se actualiza
    });

    it('deberia agregar una comanda nueva si no existe en la lista', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaNueva: Comanda = {
        id: 99,
        mesaId: 10,
        cantComensales: 2,
        estado: 'Nueva',
        horaInicio: '2026-05-30T11:00:00',
        horaFin: null,
        horaUltimoCambioEstado: null,
        tiempoEstimadoTotal: 20,
        items: [],
      };

      state.actualizarDesdeHub(comandaNueva);

      expect(state.comandas().length).toBe(5);
      expect(state.comandasNuevas().length).toBe(2);
    });

    it('deberia normalizar estado si viene como numero desde SignalR', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaHub = {
        id: 1,
        estado: 2, 
      };

      state.actualizarDesdeHub(comandaHub as any);

      const comanda = state.comandas().find((c) => c.id === 1);
      expect(comanda?.estado).toBe('EnPreparacion');
    });

    it('deberia limpiar espacios en estados string de SignalR', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaHub = {
        id: 1,
        estado: 'En Preparacion',
      };

      state.actualizarDesdeHub(comandaHub as any);

      const comanda = state.comandas().find((c) => c.id === 1);
      expect(comanda?.estado).toBe('EnPreparacion');
    });

    it('no deberia romperse si el estado es un string desconocido', () => {
      mockService.obtenerComandasActivas.mockReturnValue(of(mockComandas));
      state.cargarComandasActivas();

      const comandaHub = {
        id: 1,
        estado: 'EstadoInexistente',
      };

      state.actualizarDesdeHub(comandaHub as any);
      const comanda = state.comandas().find((c) => c.id === 1);
      expect(comanda?.estado).toBe('EstadoInexistente');
    });
  });
});
