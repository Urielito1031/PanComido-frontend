import { TestBed } from '@angular/core/testing';
import { UnirseMesa } from './unirse-mesa';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('UnirseMesa', () => {
  let component: UnirseMesa;

  const routerMock = {
    navigate: vi.fn()
  };

  const comandaStateMock = {
    obtenerBienvenidaInvitado: vi.fn(),
    setComandaDesdeSesion: vi.fn()
  };

  const routeMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => {
          const data: any = {
            comandaId: '123'
          };
          return data[key];
        }
      }
    }
  };

  beforeEach(async () => {
    comandaStateMock.obtenerBienvenidaInvitado.mockReturnValue(
      of({
        idMesa: 10,
        numeroMesa: 5,
        comandaId: 123,
        restauranteId: 1,
        cantComensales: 2
      })
    );

    await TestBed.configureTestingModule({
      imports: [UnirseMesa],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ActivatedRoute, useValue: routeMock }
      ]
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

  it('debería llamar bienvenida invitado', () => {
    component.ngOnInit();

    expect(comandaStateMock.obtenerBienvenidaInvitado)
      .toHaveBeenCalledWith(123);
  });

  it('debería setear datosMesa desde backend', () => {
    component.ngOnInit();

    expect(component.datosMesa.idMesa).toBe(10);
  });

  it('debería no unirse si no hay nombre', () => {
    component.nombre.set('');

    component.unirse();

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('debería unirse correctamente', () => {
    component.nombre.set('Juan');

    component.datosMesa = {
      idMesa: 10,
      numeroMesa: 5,
      comandaId: 123,
      restauranteId: 1,
      cantComensales: 2
    };

    component.unirse();

    expect(comandaStateMock.setComandaDesdeSesion).toHaveBeenCalled();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/ver-carta',
      1,
      10,
      2
    ]);
  });

  it('debería guardar sesión en sessionStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    component.nombre.set('Juan');

    component.datosMesa = {
      idMesa: 10,
      numeroMesa: 5,
      comandaId: 123,
      restauranteId: 1,
      cantComensales: 2
    };

    component.unirse();

    expect(setItemSpy).toHaveBeenCalledWith(
      'sesionComensal',
      expect.stringContaining('mesa')
    );
  });
});