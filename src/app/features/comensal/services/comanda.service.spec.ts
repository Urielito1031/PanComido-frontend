import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ComandaService } from './comanda.service';
import { ApiService } from '../../../core/services/api-service';
import { ItemPedido } from '../../../core/models/domain/item-pedido';
import { MesaOcuparResponse } from '../../../core/models/dtos/responses/mesa-ocupar.response';
import { ComandaClienteResponse } from '../../../core/models/dtos/responses/comanda-cliente.response';

describe('ComandaService', () => {
  let service: ComandaService;
  let apiMock: { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

  const mockItemPedido: ItemPedido = {
    plato: { id: 10, nombre: 'Pizza', precio: 1500 },
    cantidad: 2,
    observacionesIngredientes: [3, 5],
    observacionesGenerales: 'Sin cebolla',
  };

  beforeEach(() => {
    apiMock = {
      post: vi.fn(),
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ComandaService,
        { provide: ApiService, useValue: apiMock },
      ],
    });

    service = TestBed.inject(ComandaService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('ocuparMesa', () => {
    const mockResponse: MesaOcuparResponse = {
      mesa: { id: 1 } as any,
      idComandaGenerada: 42,
    };

    it('debería hacer POST al endpoint ocupar con el body correcto', () => {
      apiMock.post.mockReturnValue(of(mockResponse));

      service.ocuparMesa(1, 5, 4, 'Juan').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      expect(apiMock.post).toHaveBeenCalledWith(
        'mesa/comensal/1/5/ocupar',
        { cantidadComensales: 4, nombreComensal: 'Juan' },
      );
    });
  });

  describe('confirmarPedido', () => {
    const mockResponse: ComandaClienteResponse = {
      comandaId: 42,
      estadoUI: 'Pendiente',
      totalAPagar: 3000,
      items: [],
    };

    it('debería hacer POST al endpoint confirmar-pedido con items mapeados', () => {
      apiMock.post.mockReturnValue(of(mockResponse));

      service.confirmarPedido(42, 1, [mockItemPedido], 'Juan').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      expect(apiMock.post).toHaveBeenCalledWith(
        'comanda/42/comensal/1/confirmar-pedido',
        {
          nombreComensal: 'Juan',
          items: [
            {
              articuloId: 10,
              cantidad: 2,
              observacionesGenerales: 'Sin cebolla',
              idIngredientesPersonalizadosSacados: [3, 5],
            },
          ],
        },
      );
    });

    it('debería manejar observaciones nulas', () => {
      apiMock.post.mockReturnValue(of(mockResponse));
      const itemSinObs: ItemPedido = {
        plato: { id: 11, nombre: 'Empanada', precio: 500 },
        cantidad: 3,
        observacionesIngredientes: null,
        observacionesGenerales: undefined,
      };

      service.confirmarPedido(1, 1, [itemSinObs], 'Pepe').subscribe();

      const body = apiMock.post.mock.calls[0][1];
      expect(body.items[0].observacionesGenerales).toBeNull();
      expect(body.items[0].idIngredientesPersonalizadosSacados).toBeNull();
    });
  });

  describe('obtenerEstado', () => {
    it('debería hacer GET al endpoint estado-pedido', () => {
      const mockEstado: ComandaClienteResponse = {
        comandaId: 42,
        estadoUI: 'En preparación',
        totalAPagar: 0,
        items: [],
      };
      apiMock.get.mockReturnValue(of(mockEstado));

      service.obtenerEstado(42, 1).subscribe(res => {
        expect(res.estadoUI).toBe('En preparación');
      });

      expect(apiMock.get).toHaveBeenCalledWith('comanda/42/comensal/1/estado-pedido');
    });
  });
});
