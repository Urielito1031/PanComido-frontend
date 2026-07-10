import { TestBed } from '@angular/core/testing';
import { NroDeMesa } from './nro-de-mesa';
import { Router, ActivatedRoute } from '@angular/router';
import { MesaComensalState } from '../../services/mesa-comensal-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('NroDeMesa', () => {
  let component: NroDeMesa;

  const routerMock = {
    navigate: vi.fn(),
  };

  const mesaStateMock = {
    cargarBienvenida: vi.fn(),
    bienvenida: signal(null).asReadonly(),
    cargando: signal(false).asReadonly(),
    error: signal<string | null>(null).asReadonly(),
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

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => {
          const data: Record<string, string> = {
            restauranteId: '1',
            mesaId: '10',
          };
          return data[key] ?? null;
        },
      },
    },
  };

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [NroDeMesa],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MesaComensalState, useValue: mesaStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(NroDeMesa);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar bienvenida en ngOnInit', () => {
    component.ngOnInit();

    expect(mesaStateMock.cargarBienvenida).toHaveBeenCalledWith(10, 1);
  });

  it('debería guardar restauranteId y mesaId en sessionStorage', () => {
    component.ngOnInit();

    expect(sessionStorage.getItem('restauranteId')).toBe('1');
    expect(sessionStorage.getItem('mesaId')).toBe('10');
  });

  it('debería navegar a cantidad personas', () => {
    component.irACantidadPersonas();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/cantidad-personas']);
  });

  it('debería volver a escanear mesa', () => {
    component.volverAtras();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/escanear']);
  });
});
