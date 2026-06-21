import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PagoCheckout } from './pago-checkout';
import { PagoService } from '../../services/pago.service';
import { ComandaState } from '../../services/comanda-state';
import { ComandaHubService } from '../../../../core/services/hubs/comanda/comanda-hub-service';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { EstadoPedido, Comanda } from '../../../../core/models/domain/comanda';

describe('PagoCheckout', () => {
  let component: PagoCheckout;
  let fixture: ComponentFixture<PagoCheckout>;

  let routerMock: any;
  let routeMock: any;
  let comandaStateMock: any;
  let pagoServiceMock: any;
  let comandaHubMock: any;

  const estadoPedidoMock: EstadoPedido = {
    comandaId: 42,
    estadoUI: 'EnPreparacion',
    totalAPagar: 2500,
    items: [
      {
        articuloId: 1,
        nombre: 'Milanesa napolitana',
        cantidad: 2,
        entregado: false,
        precioUnitario: 800,
        subtotal: 1600,
        observacionesIngredientes: null,
        observacionesGenerales: null,
      },
    ],
  };

  function configurarTest(
    queryParams: Record<string, string> = {},
    estadoInicial: EstadoPedido | null = null,
  ) {
    routerMock = { navigate: vi.fn() };

    routeMock = { snapshot: { queryParams } };

    comandaStateMock = {
      estadoPedido: signal<EstadoPedido | null>(estadoInicial),
      mesaId: signal<number | null>(5),
      restauranteId: signal<number | null>(1),
      consultarEstado: vi.fn(),
      limpiarEstado: vi.fn(),
    };

    pagoServiceMock = {
      solicitarPagoEfectivo: vi.fn(),
      solicitarPagoMP: vi.fn(),
    };

    comandaHubMock = {
      comandaModificada: signal<Comanda | null>(null),
      pagoRechazado: signal<Comanda | null>(null),
      conectarComoComensal: vi.fn().mockResolvedValue(undefined),
      desconectarEscucha: vi.fn(),
    };

    const configuracionVisualStateMock = {
      colorPrimario: vi.fn().mockReturnValue('#000000'),
      colorSecundario: vi.fn().mockReturnValue('#FFFFFF'),
      nombreLocal: vi.fn().mockReturnValue(''),
      logoUrl: vi.fn().mockReturnValue(null),
      fontTitulo: vi.fn().mockReturnValue(''),
      fontCuerpo: vi.fn().mockReturnValue(''),
      cargar: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PagoCheckout],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: PagoService, useValue: pagoServiceMock },
        { provide: ComandaHubService, useValue: comandaHubMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock },
      ],
    });

    fixture = TestBed.createComponent(PagoCheckout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('inicializacion', () => {
    it('should create', () => {
      configurarTest();
      expect(component).toBeTruthy();
    });

    it('deberia consultar estado si no hay estado previo', () => {
      configurarTest();

      expect(comandaStateMock.consultarEstado).toHaveBeenCalled();
    });

    it('NO deberia consultar estado si ya hay estado', () => {
      configurarTest({}, estadoPedidoMock);

      expect(comandaStateMock.consultarEstado).not.toHaveBeenCalled();
    });

    it('deberia conectar al hub de comanda como comensal', () => {
      configurarTest();

      expect(comandaHubMock.conectarComoComensal).toHaveBeenCalledWith(5);
    });

    it('deberia mostrar error de MP si query param error=mp', () => {
      configurarTest({ error: 'mp' });

      expect(component.error()).toBe(
        'El pago con Mercado Pago fue rechazado. Elegi otro método',
      );
    });

    it('deberia mostrar error de MP si query param pending=mp', () => {
      configurarTest({ pending: 'mp' });

      expect(component.error()).toBe(
        'El pago está pendiente. Esperá unos segundos y recargá',
      );
    });
  });

  describe('volver', () => {
    it('deberia navegar a estado-pedido si no se solicito pago', () => {
      configurarTest();

      component.volver();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/estado-pedido']);
    });

    it('NO deberia navegar si ya se solicito pago', () => {
      configurarTest();
      component.pagoSolicitado.set(true);

      component.volver();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('pagarEfectivo', () => {
    it('deberia solicitar pago efectivo y navegar a confirmado', () => {
      configurarTest({}, estadoPedidoMock);
      pagoServiceMock.solicitarPagoEfectivo.mockReturnValue(of({} as any));

      component.pagarEfectivo();

      expect(pagoServiceMock.solicitarPagoEfectivo).toHaveBeenCalledWith(42, 1);
      expect(component.cargandoPago()).toBe(false);
      expect(component.pagoSolicitado()).toBe(true);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/pago-confirmado']);
    });

    it('deberia mostrar error si la API falla', () => {
      configurarTest({}, estadoPedidoMock);
      const errorMsg = 'Error al procesar pago';
      pagoServiceMock.solicitarPagoEfectivo.mockReturnValue(
        throwError(() => ({ error: { error: errorMsg } })),
      );

      component.pagarEfectivo();

      expect(component.cargandoPago()).toBe(false);
      expect(component.error()).toBe(errorMsg);
    });

    it('deberia mostrar error generico si la API falla sin mensaje', () => {
      configurarTest({}, estadoPedidoMock);
      pagoServiceMock.solicitarPagoEfectivo.mockReturnValue(
        throwError(() => ({})),
      );

      component.pagarEfectivo();

      expect(component.error()).toBe('Error al solicitar el pago');
    });

    it('NO deberia hacer nada si no hay comandaId', () => {
      configurarTest(); // estadoInicial = null → sin comandaId

      component.pagarEfectivo();

      expect(pagoServiceMock.solicitarPagoEfectivo).not.toHaveBeenCalled();
    });

    it('NO deberia hacer nada si ya se solicito pago', () => {
      configurarTest({}, estadoPedidoMock);
      component.pagoSolicitado.set(true);

      component.pagarEfectivo();

      expect(pagoServiceMock.solicitarPagoEfectivo).not.toHaveBeenCalled();
    });

    it('deberia usar restauranteId por defecto 1 si no hay', () => {
      configurarTest({}, estadoPedidoMock);
      comandaStateMock.restauranteId.set(null);
      pagoServiceMock.solicitarPagoEfectivo.mockReturnValue(of({} as any));

      component.pagarEfectivo();

      expect(pagoServiceMock.solicitarPagoEfectivo).toHaveBeenCalledWith(42, 1);
    });
  });

  describe('pagarMercadoPago', () => {
    it('deberia solicitar MP y redirigir al initPoint', () => {
      configurarTest({}, estadoPedidoMock);
      const initPoint = 'https://mercadopago.com.ar/pay/abc123';
      pagoServiceMock.solicitarPagoMP.mockReturnValue(of({ initPoint }));

      component.pagarMercadoPago();

      expect(pagoServiceMock.solicitarPagoMP).toHaveBeenCalledWith(42, 1);
      expect(component.cargandoPago()).toBe(false);
    });

    it('deberia mostrar error si la API falla', () => {
      configurarTest({}, estadoPedidoMock);
      pagoServiceMock.solicitarPagoMP.mockReturnValue(
        throwError(() => ({ error: { error: 'Error MP' } })),
      );

      component.pagarMercadoPago();

      expect(component.cargandoPago()).toBe(false);
      expect(component.error()).toBe('Error MP');
    });

    it('NO deberia hacer nada si esta cargando', () => {
      configurarTest({}, estadoPedidoMock);
      component.cargandoPago.set(true);

      component.pagarMercadoPago();

      expect(pagoServiceMock.solicitarPagoMP).not.toHaveBeenCalled();
    });

    it('NO deberia hacer nada si no hay comandaId', () => {
      configurarTest(); // estadoInicial = null

      component.pagarMercadoPago();

      expect(pagoServiceMock.solicitarPagoMP).not.toHaveBeenCalled();
    });
  });

  describe('efectos del hub (comandaModificada)', () => {
    it('deberia navegar a confirmado cuando la comanda se finaliza', () => {
      configurarTest();

      comandaHubMock.comandaModificada.set({ estado: 'Finalizada' } as Comanda);
      fixture.detectChanges();

      expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/pago-confirmado']);
    });

    it('NO deberia navegar si la comanda cambia pero no se finaliza', () => {
      configurarTest();

      comandaHubMock.comandaModificada.set({ estado: 'EnPreparacion' } as Comanda);
      fixture.detectChanges();

      expect(routerMock.navigate).not.toHaveBeenCalled();
    });
  });

  describe('efectos del hub (pagoRechazado)', () => {
    it('deberia mostrar error y desactivar loading cuando el pago se rechaza', () => {
      configurarTest();
      component.cargandoPago.set(true);

      comandaHubMock.pagoRechazado.set({} as Comanda);
      fixture.detectChanges();

      expect(component.error()).toBe('El pago fue rechazado. Intenta de nuevo.');
      expect(component.cargandoPago()).toBe(false);
    });

    it('NO deberia hacer nada si pagoRechazado es null', () => {
      configurarTest();

      fixture.detectChanges();

      expect(component.error()).toBeNull();
    });
  });

  describe('template rendering', () => {
    it('deberia mostrar el spinner de carga si no hay estado', () => {
      configurarTest();

      const spinner = fixture.nativeElement.querySelector('.spinner-border');
      expect(spinner).toBeTruthy();
    });

    it('deberia mostrar el detalle del pedido si hay estado', () => {
      configurarTest({}, estadoPedidoMock);

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Milanesa napolitana');
      expect(texto).toContain('Cantidad de ítems');
    });

    it('deberia mostrar el mensaje de error cuando error() tiene valor', () => {
      configurarTest({}, estadoPedidoMock);
      component.error.set('Hubo un problema');
      fixture.detectChanges();

      const alerta = fixture.nativeElement.querySelector('.alert-warning');
      expect(alerta).toBeTruthy();
      expect(alerta.textContent).toContain('Hubo un problema');
    });

    it('deberia mostrar "mozo en camino" cuando pagoSolicitado es true', () => {
      configurarTest({}, estadoPedidoMock);
      component.pagoSolicitado.set(true);
      fixture.detectChanges();

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('El mozo está en camino');
    });

    it('deberia mostrar spinner en boton de efectivo cuando cargandoPago es true', () => {
      configurarTest({}, estadoPedidoMock);
      component.cargandoPago.set(true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('.spinner-border');
      expect(spinner).toBeTruthy();
    });

    it('deberia mostrar el total a pagar', () => {
      configurarTest({}, estadoPedidoMock);

      const texto = fixture.nativeElement.textContent;
      expect(texto).toContain('Total:');
      expect(texto).toMatch(/Total[^0-9]*2[.,]?500/);
    });
  });

  describe('ngOnDestroy', () => {
    it('deberia desconectar la escucha del hub al destruirse', () => {
      configurarTest();

      fixture.destroy();

      expect(comandaHubMock.desconectarEscucha).toHaveBeenCalled();
    });
  });
});