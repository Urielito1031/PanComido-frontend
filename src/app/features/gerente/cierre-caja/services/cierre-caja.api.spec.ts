import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CierreCajaApiService } from './cierre-caja.api';
import { HttpClient } from '@angular/common/http';
import { vi } from 'vitest';

describe('CierreCajaApiService', () => {
  let service: CierreCajaApiService;
  let httpClientMock: any;

  beforeEach(() => {
    httpClientMock = {
      get: vi.fn(),
      post: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        CierreCajaApiService,
        { provide: HttpClient, useValue: httpClientMock }
      ]
    });

    service = TestBed.inject(CierreCajaApiService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('getTurno debería hacer un GET a api/cierre/turno', () => {
    httpClientMock.get.mockReturnValue(of({}));
    service.getTurno().subscribe();
    expect(httpClientMock.get).toHaveBeenCalledWith(expect.stringContaining('api/cierre/turno'));
  });

  it('postCierre debería hacer un POST a api/cierre', () => {
    const mockRequest: any = { empleadoId: 1, observacion: '' };
    httpClientMock.post.mockReturnValue(of({}));
    service.postCierre(mockRequest).subscribe();
    expect(httpClientMock.post).toHaveBeenCalledWith(expect.stringContaining('api/cierre'), mockRequest);
  });

  it('getHistorial debería hacer un GET a api/cierre/historial', () => {
    httpClientMock.get.mockReturnValue(of([]));
    service.getHistorial().subscribe();
    expect(httpClientMock.get).toHaveBeenCalledWith(expect.stringContaining('api/cierre/historial'));
  });
});
