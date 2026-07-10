import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoConfirmado } from './pago-confirmado';
import { ComandaState } from '../../services/comanda-state';
import { ComandaHubService } from '../../../../core/services/hubs/comanda/comanda-hub-service';

describe('PagoConfirmado', () => {
  let component: PagoConfirmado;
  let fixture: ComponentFixture<PagoConfirmado>;

  let routerMock: any;
  let routeMock: any;
  let comandaStateMock: any;
  let comandaHubMock: any;

  function crearComponente(queryParams: Record<string, string>) {
    routerMock = { navigate: vi.fn() };
    routeMock = { snapshot: { queryParams } };
    comandaStateMock = {
      estadoPedido: signal(null),
      mesaId: signal(null),
      limpiarEstado: vi.fn(),
      consultarEstado: vi.fn(),
    };
    comandaHubMock = {
      comandaModificada: signal(null),
      pagoRechazado: signal(null),
      conectarComoComensal: vi.fn().mockResolvedValue(undefined),
      desconectarEscucha: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PagoConfirmado],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ComandaHubService, useValue: comandaHubMock },
      ],
    });

    fixture = TestBed.createComponent(PagoConfirmado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('cuando status = approved (Mercado Pago)', () => {
    beforeEach(() => {
      crearComponente({ status: 'approved' });
    });

    it('deberia quedar esperando la confirmacion real del backend en vez de navegar directo', () => {
      expect(routerMock.navigate).not.toHaveBeenCalled();
      expect(component.pagoExitoso()).toBe(true);
      expect(component.metodoPago()).toBe('mercadopago');
      expect(component.esperandoConfirmacion()).toBe(true);
      expect(comandaStateMock.consultarEstado).toHaveBeenCalled();
    });

    it('deberia mostrar el mensaje de confirmacion pendiente en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Confirmando tu pago');
      expect(texto).toContain('Mercado Pago');
    });
  });

  describe('cuando status = failure', () => {
    beforeEach(() => {
      crearComponente({ status: 'failure' });
    });

    it('deberia marcar error', () => {
      expect(component.error()).toBe(true);
      expect(component.pagoExitoso()).toBe(false);
    });

    it('deberia mostrar el mensaje de error en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Error en el pago');
      expect(texto).toContain('El pago no pudo completarse');
    });
  });

  describe('cuando no hay query params (efectivo)', () => {
    beforeEach(() => {
      crearComponente({});
    });

    it('deberia marcar pago como exitoso en efectivo', () => {
      expect(component.pagoExitoso()).toBe(true);
      expect(component.metodoPago()).toBe('efectivo');
    });

    it('deberia mostrar el mensaje de efectivo en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('El mozo fue notificado');
      expect(texto).toContain('cobro en efectivo');
    });
  });

  describe('cuando metodo = tarjeta', () => {
    beforeEach(() => {
      crearComponente({ metodo: 'tarjeta' });
    });

    it('deberia marcar pago como exitoso en tarjeta', () => {
      expect(component.pagoExitoso()).toBe(true);
      expect(component.metodoPago()).toBe('tarjeta');
    });

    it('deberia mostrar el mensaje de tarjeta en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('El mozo fue notificado');
      expect(texto).toContain('cobro con tarjeta');
    });
  });

  describe('cuando metodo = transferencia', () => {
    beforeEach(() => {
      crearComponente({ metodo: 'transferencia' });
    });

    it('deberia marcar pago como exitoso en transferencia', () => {
      expect(component.pagoExitoso()).toBe(true);
      expect(component.metodoPago()).toBe('transferencia');
    });

    it('deberia mostrar el mensaje de transferencia en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('El mozo fue notificado');
      expect(texto).toContain('recepción de tu transferencia');
    });
  });

  describe('cuando el hub notifica PagoRechazado mientras se espera confirmacion de MP', () => {
    it('deberia navegar a pago-checkout con error=mp', () => {
      crearComponente({ status: 'approved' });

      comandaHubMock.pagoRechazado.set({ id: 1, estado: 0 } as any);
      fixture.detectChanges();

      expect(routerMock.navigate).toHaveBeenCalledWith(
        ['/comensal/pago-checkout'],
        { queryParams: { error: 'mp' } }
      );
    });
  });

  describe('volverInicio', () => {
    it('deberia limpiar el estado y navegar a escanear', () => {
      crearComponente({});

      component.volverInicio();

      expect(comandaStateMock.limpiarEstado).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/escanear']);
    });
  });
});
