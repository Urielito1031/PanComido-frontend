import { TestBed } from '@angular/core/testing';
import { StockMercaderiaState } from './stock-mercaderia-state';
import { StockMercaderiaService } from './stock-mercaderia-service';
import { UnidadMedidaService } from '../unidad-medida.service';
import { CategoriaInsumoService } from '../categorias/categoria-insumo.service';
import { PlatoApiService } from '../../../services/plato.api';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Insumo } from '../../../../../core/models/domain/insumo';
import { INSUMOS_MOCK } from '../../../../../infra/mocks/insumo.mock-data';
import { GuardarProductoPayload } from '../../components/producto-form/producto-form';

describe('StockMercaderiaState', () => {
  let state: StockMercaderiaState;
  let mockService: any;
  let mockUnidadMedida: any;
  let mockCategoriaInsumo: any;
  let mockPlatoApi: any;

  beforeEach(() => {
    mockService = {
      getStockMercaderia: vi.fn(),
      getById: vi.fn(),
      crear: vi.fn(),
      actualizarInsumoConImagen: vi.fn(),
      eliminar: vi.fn()
    };

    mockUnidadMedida = {
      getUnidadesMedida: vi.fn().mockReturnValue(of([])),
    };

    mockCategoriaInsumo = {
      getCategorias: vi.fn().mockReturnValue(of([])),
    };

    mockPlatoApi = {
      getDatosFormulario: vi.fn().mockReturnValue(of({ porcentajes: { platos: [], bebidas: [] } })),
      getPlatos: vi.fn().mockReturnValue(of([]))
    };

    TestBed.configureTestingModule({
      providers: [
        StockMercaderiaState,
        { provide: StockMercaderiaService, useValue: mockService },
        { provide: UnidadMedidaService, useValue: mockUnidadMedida },
        { provide: CategoriaInsumoService, useValue: mockCategoriaInsumo },
        { provide: PlatoApiService, useValue: mockPlatoApi }
      ]
    });

    state = TestBed.inject(StockMercaderiaState);
  });

  it('debería crearse correctamente', () => {
    expect(state).toBeTruthy();
  });

  describe('Estado inicial', () => {
    it('debería tener arrays vacíos al inicio', () => {
      expect(state.productos()).toEqual([]);
      expect(state.cargando()).toBe(false);
    });
  });

  describe('cargarMercaderia()', () => {
    it('debería cargar productos y actualizar el signal', () => {
      mockService.getStockMercaderia.mockReturnValue(of(INSUMOS_MOCK));

      state.cargarMercaderia();

      expect(mockService.getStockMercaderia).toHaveBeenCalled();
      expect(state.productos()).toEqual(INSUMOS_MOCK);
      expect(state.cargando()).toBe(false);
    });

    it('debería manejar errores correctamente', () => {
      mockService.getStockMercaderia.mockReturnValue(throwError(() => new Error('Error de red')));

      state.cargarMercaderia();

      expect(state.cargando()).toBe(false);
    });
  });

  describe('guardarProducto()', () => {
    it('debería crear un nuevo producto cuando el payload no tiene id', () => {
      const payload: GuardarProductoPayload = {
        nombre: 'Sal',
        descripcion: '',
        categoriaId: 1,
        unidadDeMedidaId: 1,
        stockMinimo: 5,
        stockRecomendado: 10,
        esPrecioManual: false,
        bodegaId: 2,
        cantidadInicial: 15,
        fechaVencimiento: '2028-01-01'
      };

      const productoCreado: Insumo = {
        id: 99,
        nombre: 'Sal',
        stockActual: 15,
        vencimiento: '2028-01-01',
        unidadMedida: { id: 1, nombre: 'Kg' },
        categoriaIngrediente: { id: 1, descripcion: 'Almacen', tipoAplica: 'Ingrediente' },
        stockMinimo: 5,
        esPrecioManual: false
      };

      mockService.crear.mockReturnValue(of(productoCreado));

      state.guardarProducto(payload);

      expect(mockService.crear).toHaveBeenCalledWith(expect.objectContaining({
        nombre: 'Sal',
        categoriaId: 1,
        bodegaId: 2,
        cantidadInicial: 15
      }), undefined);
      expect(state.productos()).toContainEqual(productoCreado);
    });

    it('debería actualizar un producto existente cuando el payload tiene id', () => {
      mockService.getStockMercaderia.mockReturnValue(of(INSUMOS_MOCK));
      state.cargarMercaderia();
      const idExistente = INSUMOS_MOCK[0].id;

      const payload: GuardarProductoPayload = {
        id: idExistente,
        nombre: 'Sal fina',
        descripcion: '',
        categoriaId: 1,
        unidadDeMedidaId: 1,
        stockMinimo: 5,
        stockRecomendado: 10,
        esPrecioManual: false
      };

      mockService.actualizarInsumoConImagen.mockReturnValue(of({
        id: idExistente,
        nombre: 'Sal fina',
        descripcion: null,
        esPrecioManual: false,
        stockMinimo: 5,
        stockRecomendado: 10,
        categoriaId: 1,
        unidadDeMedidaId: 1,
        urlImagen: null,
        tipo: 'Ingrediente'
      }));

      state.guardarProducto(payload);

      expect(mockService.actualizarInsumoConImagen).toHaveBeenCalledWith(idExistente, expect.objectContaining({ nombre: 'Sal fina' }), undefined);
      expect(state.productos().find(p => p.id === idExistente)?.nombre).toBe('Sal fina');
    });
  });

  describe('eliminarProducto()', () => {
    it('debería eliminar un producto', () => {
      mockService.eliminar.mockReturnValue(of(void 0));

      // Precargamos datos
      mockService.getStockMercaderia.mockReturnValue(of(INSUMOS_MOCK));
      state.cargarMercaderia();

      state.eliminarProducto(1);

      expect(mockService.eliminar).toHaveBeenCalledWith(1);
    });
  });

  describe('Computed Signals', () => {
    it('productosCriticos debería filtrar productos con stock bajo', () => {
      mockService.getStockMercaderia.mockReturnValue(of(INSUMOS_MOCK));
      state.cargarMercaderia();

      expect(state.productosCriticos().length).toBeGreaterThan(0);
      expect(state.cantidadProductosCriticos()).toBeGreaterThan(0);
    });
  });
});
