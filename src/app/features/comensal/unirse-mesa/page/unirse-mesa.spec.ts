import { TestBed } from '@angular/core/testing';
import { UnirseMesa } from './unirse-mesa';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { MesaComensalState } from '../../services/mesa-comensal-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('UnirseMesa', () => {
  let component: UnirseMesa;

  const routerMock = {
    navigate: vi.fn(),
  };

  const comandaStateMock = {
    setComandaDesdeSesion: vi.fn(),
  };

  const bienvenidaInvitadoSignal = signal<any>({
    idMesa: 10,
    numeroMesa: 5,
    comandaId: 123,
    restauranteId: 1,
    cantComensales: 2,
  });

  const mesaComensalStateMock = {
    cargarBienvenidaInvitado: vi.fn(),
    bienvenidaInvitado: bienvenidaInvitadoSignal.asReadonly(),
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

  const routeMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => {
          const data: Record<string, string> = { comandaId: '123' };
          return data[key] ?? null;
        },
      },
    },
  };

  beforeEach(async () => {
    sessionStorage.clear();

    await TestBed.configureTestingModule({
      imports: [UnirseMesa],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: MesaComensalState, useValue: mesaComensalStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(UnirseMesa);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar comandaId desde route', () => {
    component.ngOnInit();

    expect(component.comandaId).toBe(123);
  });

  it('debería llamar cargarBienvenidaInvitado en ngOnInit', () => {
    component.ngOnInit();

    expect(mesaComensalStateMock.cargarBienvenidaInvitado).toHaveBeenCalledWith(123);
  });

  it('debería no unirse si no hay nombre', () => {
    component.nombre.set('');

    component.unirse();

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('debería unirse correctamente', () => {
    component.nombre.set('Juan');

    component.unirse();

    expect(comandaStateMock.setComandaDesdeSesion).toHaveBeenCalledWith({
      comandaId: 123,
      restauranteId: 1,
      mesaId: 10,
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/ver-carta']);
  });

  it('debería guardar sesión en sessionStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    component.nombre.set('Juan');

    component.unirse();

    expect(setItemSpy).toHaveBeenCalledWith(
      'sesionComensal',
      expect.stringContaining('mesa'),
    );
  });
});
