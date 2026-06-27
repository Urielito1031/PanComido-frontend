import { TestBed } from '@angular/core/testing';
import { CantidadPersonas } from './cantidad-personas';
import { Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('CantidadPersonas', () => {
  let component: CantidadPersonas;

  const routerMock = {
    navigate: vi.fn()
  };

  const comandaStateMock = {
    cargando: signal(false).asReadonly(),
    ocuparMesa: vi.fn()
  };

  beforeEach(async () => {
    sessionStorage.setItem('restauranteId', '1');
    sessionStorage.setItem('mesaId', '10');

    await TestBed.configureTestingModule({
      imports: [CantidadPersonas],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ComandaState, useValue: comandaStateMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CantidadPersonas);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
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

    expect(comandaStateMock.ocuparMesa).toHaveBeenCalledWith(1, 10, 1, 'Juan');
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

    vi.spyOn(Storage.prototype, 'getItem').mockReturnValueOnce(
      JSON.stringify({
        restauranteId: 1,
        mesaId: 10
      })
    );

    component.aceptar();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/ver-carta']);
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