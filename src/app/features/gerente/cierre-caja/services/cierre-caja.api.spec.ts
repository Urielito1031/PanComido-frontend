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

  it('generarCierre debería hacer un POST a cierre-caja/generar', () => {
    const mockRequest = { idTurnoLaboral: 1, conteoCaja: 1000 };
    httpClientMock.post.mockReturnValue(of({}));
    service.generarCierre(mockRequest).subscribe();
    expect(httpClientMock.post).toHaveBeenCalledWith(expect.stringContaining('cierre-caja/generar'), mockRequest);
  });

  it('getHistorial debería hacer un GET a cierre-caja', () => {
    httpClientMock.get.mockReturnValue(of([]));
    service.getHistorial().subscribe();
    expect(httpClientMock.get).toHaveBeenCalledWith(expect.stringContaining('cierre-caja'));
  });
});
