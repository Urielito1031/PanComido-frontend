import { TestBed } from '@angular/core/testing';
import { CantidadPersonas } from './cantidad-personas';
import { Router, ActivatedRoute } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('CantidadPersonas', () => {
  let component: CantidadPersonas;

  const routerMock = {
    navigate: vi.fn()
  };

  const comandaStateMock = {
    cargando: false,
    ocuparMesa: vi.fn()
  };

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: (key: string) => {
          const data: any = {
            restauranteId: '1',
            mesaId: '10'
          };
          return data[key];
        },
        keys: []
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CantidadPersonas],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CantidadPersonas);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería expandir opciones', () => {
    component.maxCantidad = 5;
    component.expandirOpciones();

    expect(component.maxCantidad).toBe(10);
  });

  it('debería seleccionar cantidad', () => {
    component.seleccionarCantidad(3);

    expect(component.cantidadPersonas).toBe(3);
  });

  it('debería aceptar y navegar al éxito', () => {
    component.nombreComensal = 'Juan';

    const response = {
      restauranteId: 1,
      mesaId: 10,
      idComandaGenerada: 99
    };

    comandaStateMock.ocuparMesa.mockReturnValue(of(response));

    component.aceptar();

    expect(comandaStateMock.ocuparMesa).toHaveBeenCalled();
  });

  it('debería manejar mesa ocupada (409) con sesión válida', () => {
    component.nombreComensal = 'Juan';

    const error = {
      status: 409,
      error: {}
    };

    comandaStateMock.ocuparMesa.mockReturnValue(
      throwError(() => error)
    );

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({
        restauranteId: 1,
        mesaId: 10
      })
    );

    component.aceptar();

    expect(routerMock.navigate).toHaveBeenCalled();
  });

  it('debería volver atrás', () => {
    component.volverAtras();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      'comensal/mesa',
      1,
      10
    ]);
  });
});