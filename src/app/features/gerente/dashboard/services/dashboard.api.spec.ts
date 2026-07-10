import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardApiService, DashboardResumenOperativoResponse } from './dashboard.api';
import { DashboardVencimientoDto } from '../../../../core/models/dtos/responses/dashboard-vencimiento.response';
import { DashboardRendimientoResponseDto } from '../../../../core/models/dtos/responses/dashboard-rendimiento.response';
import { environment } from '../../../../../environments/environment';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getVencimientos', () => {
    it('should call api and map vencimientos', () => {
      const mockResponse: any[] = [
        { nombre: 'Tomate', fecha: '2023-12-01', cantidad: '5', criticidad: 'alta', relativo: 'En 2 días' }
      ];

      service.getVencimientos().subscribe(res => {
        expect(res.length).toBe(1);
        expect(res[0].nombre).toBe('Tomate');
        expect(res[0].cantidad).toBe('5');
        expect(res[0].criticidad).toBe('alta');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/gerente/dashboard/vencimientos`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getRendimientoComercial', () => {
    it('should call api and map rendimiento with camelCase props', () => {
      const mockResponse: any = {
        masVendidos: [{ nombre: 'Pizza', unidades: '10', facturacion: '$ 100' }],
        menosVendidos: []
      };

      service.getRendimientoComercial('2023-01-01', '2023-01-31').subscribe(res => {
        expect(res.masVendidos.length).toBe(1);
        expect(res.masVendidos[0].nombre).toBe('Pizza');
        expect(res.masVendidos[0].valor).toBe(10);
        expect(res.menosVendidos.length).toBe(0);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/gerente/dashboard/rendimiento` &&
        request.params.get('desde') === '2023-01-01' &&
        request.params.get('hasta') === '2023-01-31'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call api and map rendimiento with PascalCase props fallback', () => {
      const mockResponse: any = {
        MasVendidos: [],
        MenosVendidos: [{ Nombre: 'Sopa', Unidades: '1', Facturacion: '$ 10' }]
      };

      service.getRendimientoComercial('2023-01-01', '2023-01-31').subscribe(res => {
        expect(res.masVendidos.length).toBe(0);
        expect(res.menosVendidos.length).toBe(1);
        expect(res.menosVendidos[0].nombre).toBe('Sopa');
        expect(res.menosVendidos[0].valor).toBe(1);
      });

      const req = httpMock.expectOne(request => request.url.includes('/gerente/dashboard/rendimiento'));
      req.flush(mockResponse);
    });
  });

  describe('getResumenOperativo', () => {
    it('should fetch resumen operativo passing correct params', () => {
      const mockResponse: DashboardResumenOperativoResponse = {
        totalVentas: '$ 1,000',
        totalPedidos: 10,
        ticketPromedio: '$ 100',
        promedioDiarioPedidos: 5,
        variacionVentas: '+10%',
        variacionPedidos: '+5%',
        variacionTicket: '+2%',
        grafico: [],
        mozos: []
      };

      service.getResumenOperativo('2023-01-01', '2023-01-31').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/gerente/dashboard/resumen` &&
        request.params.get('desde') === '2023-01-01' &&
        request.params.get('hasta') === '2023-01-31'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getSatisfaccionComensal', () => {
    it('should fetch satisfaction metrics with date range params', () => {
      const mockResponse = {
        promedioComida: 3.71,
        promedioLugar: 3.84,
        promedioAtencion: 3.23,
        totalEncuestas: 31,
        totalDerivadosGoogleMaps: 13,
        porcentajeDerivados: 41.9
      };

      service.getSatisfaccionComensal('2026-07-01', '2026-07-06').subscribe(res => {
        expect(res).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(request =>
        request.url === `${environment.apiUrl}/gerente/dashboard/satisfaccion` &&
        request.params.get('desde') === '2026-07-01' &&
        request.params.get('hasta') === '2026-07-06'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
