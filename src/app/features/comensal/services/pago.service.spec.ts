import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PagoService } from './pago.service';
import { ApiService } from '../../../core/services/api-service';
import { MetodoPagoId } from '../../../core/models/domain/metodo-pago';

describe('PagoService', () => {
  let service: PagoService;
    let apiMock: Pick<ApiService, keyof ApiService>;
  let postMock: ReturnType<typeof vi.fn>;

  function configurarTest() {
    postMock = vi.fn();

    apiMock = {
      post: postMock,
    } as unknown as Pick<ApiService, keyof ApiService>;

    TestBed.configureTestingModule({
      providers: [
        PagoService,
        { provide: ApiService, useValue: apiMock },
      ],
    });

    service = TestBed.inject(PagoService);
  }

  beforeEach(() => {
    configurarTest();
  });

  describe('solicitarPago', () => {
    it('deberia llamar a api.post con la URL correcta y el metodoPago en el body', () => {
      const mockResponse = { id: 1, resuelto: false } as any;
      postMock.mockReturnValue(of(mockResponse));

      const result = service.solicitarPago(10, 5, MetodoPagoId.Efectivo);

      expect(apiMock.post).toHaveBeenCalledWith(
        'pago/solicitar-pago/10/comensal/5',
        { metodoPago: MetodoPagoId.Efectivo },
      );
      result.subscribe(res => {
        expect(res).toEqual(mockResponse);
      });
    });
  });

  describe('solicitarPagoMP', () => {
    it('deberia llamar a api.post con la URL correcta y body vacio', () => {
      const mockResponse = { initPoint: 'https://mercadopago.com/pay/123' };
      postMock.mockReturnValue(of(mockResponse));

      const result = service.solicitarPagoMP(10, 5);

      expect(apiMock.post).toHaveBeenCalledWith(
        'pago/solicitar-mp/10/comensal/5',
        {},
      );
      result.subscribe(res => {
        expect(res.initPoint).toBe('https://mercadopago.com/pay/123');
      });
    });
  });
});