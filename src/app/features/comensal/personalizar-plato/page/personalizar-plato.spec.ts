import { TestBed } from '@angular/core/testing';
import { PersonalizarPlato } from './personalizar-plato';
import { Router } from '@angular/router';
import { PlatoService } from '../../services/plato.service';
import { PedidoState } from '../../services/pedido.state';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ChangeDetectorRef } from '@angular/core';

describe('PersonalizarPlato', () => {
  let component: PersonalizarPlato;

  const routerMock = {
    navigate: vi.fn()
  };

  const pedidoStateMock = {
    actualizarItem: vi.fn()
  };

  const platoServiceMock = {
    getPlatoDetalle: vi.fn()
  };

  const cdrMock = {
    markForCheck: vi.fn()
  };

  beforeEach(async () => {
    platoServiceMock.getPlatoDetalle.mockReturnValue(
      of({
        ingredientes: [
          { nombre: 'Queso', opcional: true },
          { nombre: 'Tomate', opcional: true },
          { nombre: 'Pan', opcional: false }
        ]
      })
    );

    // mock history.state
    vi.spyOn(history, 'state', 'get').mockReturnValue({
      plato: {
        plato: { articuloId: 1 }
      },
      index: 0
    });

    await TestBed.configureTestingModule({
      imports: [PersonalizarPlato],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: PlatoService, useValue: platoServiceMock },
        { provide: ChangeDetectorRef, useValue: cdrMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonalizarPlato);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar detalle del plato en ngOnInit', () => {
    component.ngOnInit();

    expect(platoServiceMock.getPlatoDetalle).toHaveBeenCalledWith(1);
  });

  it('debería filtrar ingredientes opcionales', () => {
    component.ngOnInit();

    expect(component.ingredientesExtra).toEqual(['Queso', 'Tomate']);
    expect(component.ingredientesRemover).toEqual(['Queso', 'Tomate']);
  });

  it('debería toggle extra ingrediente', () => {
    component.extrasSeleccionados = [];

    component.toggleExtra('Queso');

    expect(component.extrasSeleccionados).toContain('Queso');
  });

  it('debería remover extra si ya existe', () => {
    component.extrasSeleccionados = ['Queso'];

    component.toggleExtra('Queso');

    expect(component.extrasSeleccionados).not.toContain('Queso');
  });

  it('debería bloquear extra si está en removidos', () => {
    component.removidosSeleccionados = ['Queso'];

    component.toggleExtra('Queso');

    expect(component.extrasSeleccionados).not.toContain('Queso');
  });

  it('debería toggle remover ingrediente', () => {
    component.removidosSeleccionados = [];

    component.toggleRemover('Tomate');

    expect(component.removidosSeleccionados).toContain('Tomate');
  });

  it('debería guardar cambios y navegar', () => {
    component.plato = {
      observacionesGenerales: 'Sin sal'
    } as any;

    component.extrasSeleccionados = ['Queso'];
    component.removidosSeleccionados = ['Tomate'];
    component.observaciones = 'Extra picante';

    component.guardarCambios();

    expect(pedidoStateMock.actualizarItem).toHaveBeenCalled();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/pedido'
    ]);
  });

  it('debería volver al pedido', () => {
    component.volver();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/pedido'
    ]);
  });
});