import { TestBed } from '@angular/core/testing';
import { ComensalPreviewComponent } from './comensal-preview';
import { CartaState } from '../../../../comensal/ver-carta/service/carta-state';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('ComensalPreviewComponent', () => {
  const cartaStateMock = {
    items: signal([]),
    cargando: signal(false),
    cargarCarta: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComensalPreviewComponent],
      providers: [
        { provide: CartaState, useValue: cartaStateMock },
      ],
    }).compileComponents();
  });

  function createFixture(datosLocal: any, familiasTipograficas?: any[]) {
    const fixture = TestBed.createComponent(ComensalPreviewComponent);
    fixture.componentRef.setInput('datosLocal', datosLocal);
    if (familiasTipograficas) {
      fixture.componentRef.setInput('familiasTipograficas', familiasTipograficas);
    }
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('debería crearse', () => {
    const { component } = createFixture({ id: 1, nombre: 'Test', colorPrincipal: '#000', colorSecundario: '#fff' });
    expect(component).toBeTruthy();
  });

  describe('computed signals', () => {
    const mockDatosLocal = {
      id: 1,
      nombre: 'Mi Restó',
      colorPrincipal: '#c0392b',
      colorSecundario: '#f39c12',
      imagen: 'https://ejemplo.com/logo.png',
      familiaTipograficaId: 2,
    };

    const mockFamilias: any[] = [
      { id: 1, categoria: 'Moderna', tipografiaTitulo: 'Roboto', tipografiaCuerpo: 'Open Sans' },
      { id: 2, categoria: 'Clásica', tipografiaTitulo: 'Playfair Display', tipografiaCuerpo: 'Lora' },
    ];

    it('debería devolver el colorPrimario correcto', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      expect(component.colorPrimario()).toBe('#c0392b');
    });

    it('debería devolver el colorPrimario por defecto cuando no está configurado', () => {
      const { component } = createFixture({ id: 1, nombre: 'Test' });
      expect(component.colorPrimario()).toBe('#1a4a2e');
    });

    it('debería devolver el colorSecundario correcto', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      expect(component.colorSecundario()).toBe('#f39c12');
    });

    it('debería devolver el colorSecundario por defecto cuando no está configurado', () => {
      const { component } = createFixture({ id: 1, nombre: 'Test' });
      expect(component.colorSecundario()).toBe('#f08f1a');
    });

    it('debería devolver nombreLocal desde el input', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      expect(component.nombreLocal()).toBe('Mi Restó');
    });

    it('debería devolver nombreLocal por defecto cuando no está configurado', () => {
      const { component } = createFixture({ id: 1 } as any);
      expect(component.nombreLocal()).toBe('Nombre del local');
    });

    it('debería devolver el logo desde imagen', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      expect(component.logo()).toBe('https://ejemplo.com/logo.png');
    });

    it('debería devolver null como logo cuando imagen está ausente', () => {
      const { component } = createFixture({ id: 1, nombre: 'Test' });
      expect(component.logo()).toBeNull();
    });

    it('debería encontrar familiaActual por familiaTipograficaId', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      const familia = component.familiaActual();
      expect(familia).toBeTruthy();
      expect(familia?.categoria).toBe('Clásica');
    });

    it('debería devolver undefined cuando no hay familia que coincida', () => {
      const { component } = createFixture(
        { id: 1, nombre: 'Test', familiaTipograficaId: 99 },
        mockFamilias,
      );
      expect(component.familiaActual()).toBeUndefined();
    });

    it('debería computar fontTitulo desde la familia coincidente', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      expect(component.fontTitulo()).toBe('Playfair Display, sans-serif');
    });

    it('debería computar fontCuerpo desde la familia coincidente', () => {
      const { component } = createFixture(mockDatosLocal, mockFamilias);
      expect(component.fontCuerpo()).toBe('Lora, sans-serif');
    });

    it('debería usar fuentes de respaldo cuando no hay familia que coincida', () => {
      const { component } = createFixture({ id: 1, nombre: 'Test' });
      expect(component.fontTitulo()).toBe('system-ui, sans-serif');
      expect(component.fontCuerpo()).toBe('system-ui, sans-serif');
    });
  });

  describe('cargando', () => {
    it('debería reflejar cartaState.cargando', () => {
      const { component } = createFixture({ id: 1, nombre: 'Test' });
      expect(component.cargando()).toBe(false);

      cartaStateMock.cargando.set(true);

      expect(component.cargando()).toBe(true);
    });
  });

  describe('displayItems', () => {
    it('debería usar cartaState.items cuando estén disponibles', () => {
      const mockItems = [
        { id: 1, nombre: 'Pizza', esDestacado: true, tipoPlato: 'Principal', tiempoPreparacionEstimado: 20, precio: 1800, urlImagen: null },
      ];
      cartaStateMock.items.set(mockItems as any);

      const { component } = createFixture({ id: 1, nombre: 'Test' });
      const items = component.displayItems();

      expect(items.length).toBe(1);
      expect(items[0].nombre).toBe('Pizza');
      expect(items[0].precio).toBe('$ 1.800');
    });

    it('debería usar datos mock cuando cartaState.items está vacío', () => {
      cartaStateMock.items.set([]);

      const { component } = createFixture({ id: 1, nombre: 'Test' });
      const items = component.displayItems();

      expect(items.length).toBe(2);
      expect(items[0].nombre).toBe('Pollo a la crema');
      expect(items[1].nombre).toBe('Milanesa napolitana');
    });
  });

  describe('effect', () => {
    it('debería llamar a cartaState.cargarCarta al iniciar con datosLocal.id', () => {
      cartaStateMock.cargarCarta.mockClear();
      createFixture({ id: 7, nombre: 'Test' });
      expect(cartaStateMock.cargarCarta).toHaveBeenCalledWith(7);
    });

    it('debería no llamar a cargarCarta si id es falsy', () => {
      cartaStateMock.cargarCarta.mockClear();
      createFixture({ nombre: 'Test' } as any);
      expect(cartaStateMock.cargarCarta).not.toHaveBeenCalled();
    });
  });
});
