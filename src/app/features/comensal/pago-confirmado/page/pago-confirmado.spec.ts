import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PagoConfirmado } from './pago-confirmado';
import { ComandaState } from '../../services/comanda-state';

describe('PagoConfirmado', () => {
  let component: PagoConfirmado;
  let fixture: ComponentFixture<PagoConfirmado>;

  let routerMock: any;
  let routeMock: any;
  let comandaStateMock: any;

  function crearComponente(queryParams: Record<string, string>) {
    routerMock = { navigate: vi.fn() };
    routeMock = { snapshot: { queryParams } };
    comandaStateMock = {
      estadoPedido: signal(null),
      mesaId: signal(null),
      limpiarEstado: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PagoConfirmado],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ComandaState, useValue: comandaStateMock },
      ],
    });

    fixture = TestBed.createComponent(PagoConfirmado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('cuando status = approved', () => {
    beforeEach(() => {
      crearComponente({ status: 'approved' });
    });

    it('deberia marcar pago como exitoso y no efectivo', () => {
      expect(component.pagoExitoso()).toBe(true);
      expect(component.esEfectivo()).toBe(false);
    });

    it('deberia mostrar el mensaje de exito en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Gracias por tu compra');
      expect(texto).toContain('Tu pago fue procesado correctamente');
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
      expect(component.esEfectivo()).toBe(true);
    });

    it('deberia mostrar el mensaje de efectivo en el template', () => {
      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Gracias por tu compra');
      expect(texto).toContain('El mozo se acercará a la brevedad');
    });
  });

  describe('volverInicio', () => {
    it('deberia limpiar el estado y navegar a escanear-mesa', () => {
      crearComponente({});

      component.volverInicio();

      expect(comandaStateMock.limpiarEstado).toHaveBeenCalled();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/escanear-mesa']);
    });
  });
});