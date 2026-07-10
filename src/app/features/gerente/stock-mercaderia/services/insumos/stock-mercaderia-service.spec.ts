import { TestBed } from '@angular/core/testing';

import { StockMercaderiaService } from './stock-mercaderia-service';
import { of } from 'rxjs';
import { ApiService } from '../../../../../core/services/api-service';
import { CrearInsumoRequest } from '../../../../../core/models/dtos/requests/crear-insumo.request';

describe('StockMercaderiaService', () => {
  let service: StockMercaderiaService;
  let mockApiService: any;

  const mockInsumoDto = {
    id: 1,
    nombre: 'Harina',
    stockActual: 10,
    stockMinimo: 5,
    vencimiento: null,
    unidadMedida: 'KG',
    categoria: 'Almacen',
    tipo: 'Ingrediente'
  };

  const mockDetalleInsumoDto = {
    id: 1,
    nombre: 'Harina',
    descripcion: 'Harina 0000',
    precioVentaFinal: 100,
    esPrecioManual: false,
    stockMinimo: 5,
    stockRecomendado: 20,
    categoriaId: 2,
    unidadDeMedidaId: 3,
    urlImagen: null,
    tipo: 'Ingrediente'
  };

  beforeEach(() => {
    mockApiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        StockMercaderiaService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(StockMercaderiaService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('Métodos HTTP', () => {
    it('getStockMercaderia() debería llamar al endpoint correcto', () => {
      mockApiService.get.mockReturnValue(of([mockInsumoDto]));

      service.getStockMercaderia().subscribe(result => {
        expect(result[0].unidadMedida).toEqual({ id: 0, nombre: 'KG' });
      });

      expect(mockApiService.get).toHaveBeenCalledWith('insumo');
    });

    it('getById() debería llamar con el id correcto y mapear el detalle', () => {
      mockApiService.get.mockReturnValue(of(mockDetalleInsumoDto));

      service.getById(5).subscribe(result => {
        expect(result.id).toBe(1);
        expect(result.categoriaId).toBe(2);
        expect(result.unidadDeMedidaId).toBe(3);
        expect(result.stockRecomendado).toBe(20);
      });

      expect(mockApiService.get).toHaveBeenCalledWith('insumo/5');
    });

    it('crear() debería hacer POST con FormData', () => {
      const nuevoProducto: CrearInsumoRequest = {
        nombre: 'Azúcar',
        descripcion: 'Azúcar blanca',
        precioVentaFinal: 100,
        esPrecioManual: false,
        stockMinimo: 5,
        stockRecomendado: 10,
        categoriaId: 1,
        unidadDeMedidaId: 1,
        bodegaId: 1,
        cantidadInicial: 20,
        fechaVencimiento: '2026-12-31'
      };
      mockApiService.post.mockReturnValue(of({ insumo: mockInsumoDto, mensaje: 'ok' }));

      service.crear(nuevoProducto).subscribe();

      expect(mockApiService.post).toHaveBeenCalledWith('insumo', expect.any(FormData));
      const formData: FormData = mockApiService.post.mock.calls[0][1];
      expect(formData.get('Nombre')).toBe('Azúcar');
      expect(formData.get('CategoriaId')).toBe('1');
      expect(formData.get('BodegaId')).toBe('1');
      expect(formData.get('UnidadDeMedidaId')).toBe('1');
    });

    it('actualizarInsumoConImagen() debería hacer PUT con FormData', () => {
      mockApiService.put.mockReturnValue(of({ insumo: { ...mockInsumoDto, urlImagen: 'https://res.cloudinary.com/nueva.jpg' }, mensaje: 'ok' }));

      service.actualizarInsumoConImagen(1, {
        nombre: 'Gaseosa',
        esPrecioManual: false,
        stockMinimo: 5,
        stockRecomendado: 20,
        categoriaId: 4,
        unidadDeMedidaId: 3,
        precioVentaFinal: 500
      }).subscribe(result => {
        expect(result.id).toBe(1);
        expect(result.nombre).toBe('Gaseosa');
        expect(result.urlImagen).toBe('https://res.cloudinary.com/nueva.jpg');
      });

      expect(mockApiService.put).toHaveBeenCalledWith('insumo/1', expect.any(FormData));
      const formData: FormData = mockApiService.put.mock.calls[0][1];
      expect(formData.get('Nombre')).toBe('Gaseosa');
      expect(formData.get('PrecioVentaFinal')).toBe('500');
      expect(formData.get('EsPrecioManual')).toBe('false');
    });

    it('eliminar() debería hacer DELETE', () => {
      mockApiService.delete.mockReturnValue(of(void 0));

      service.eliminar(7).subscribe();

      expect(mockApiService.delete).toHaveBeenCalledWith('insumo/7');
    });

    it('crearLote() debería hacer POST al endpoint de lotes', () => {
      const request = {
        insumoId: 1,
        cantidad: 10,
        fechaVencimiento: '2026-08-15',
        bodegaId: 2
      };
      mockApiService.post.mockReturnValue(of({ mensaje: 'Lote creado exitosamente.' }));

      service.crearLote(request).subscribe(result => {
        expect(result.mensaje).toBe('Lote creado exitosamente.');
      });

      expect(mockApiService.post).toHaveBeenCalledWith('lote/crear', request);
    });

    it('modificarLote() debería hacer PUT al endpoint de lotes', () => {
      const request = {
        insumoId: 1,
        cantidad: 8,
        fechaVencimiento: '2026-09-01',
        bodegaId: 2
      };
      mockApiService.put.mockReturnValue(of({ mensaje: 'Lote modificado exitosamente.' }));

      service.modificarLote(3, request).subscribe(result => {
        expect(result.mensaje).toBe('Lote modificado exitosamente.');
      });

      expect(mockApiService.put).toHaveBeenCalledWith('lote/3', request);
    });

    it('eliminarLote() debería hacer DELETE al endpoint de lotes', () => {
      mockApiService.delete.mockReturnValue(of({ mensaje: 'Lote eliminado exitosamente.' }));

      service.eliminarLote(3).subscribe(result => {
        expect(result.mensaje).toBe('Lote eliminado exitosamente.');
      });

      expect(mockApiService.delete).toHaveBeenCalledWith('lote/3');
    });
  });
});
