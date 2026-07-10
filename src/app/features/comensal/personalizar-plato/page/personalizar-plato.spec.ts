import { TestBed } from '@angular/core/testing';
import { PersonalizarPlato } from './personalizar-plato';
import { Router } from '@angular/router';
import { PlatoService } from '../../services/plato.service';
import { PedidoState } from '../../services/pedido.state';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('PersonalizarPlato', () => {
  let component: PersonalizarPlato;

  const routerMock = {
    navigate: vi.fn(),
  };

  const pedidoStateMock = {
    actualizarItemEnIndice: vi.fn(),
    agregarPedido: vi.fn(),
  };

  const comandaStateMock = {
    restauranteId: signal(1).asReadonly(),
  };

  const comensalStateMock = {};

  const configuracionVisualStateMock = {
    colorPrimario: vi.fn().mockReturnValue('#000000'),
    colorSecundario: vi.fn().mockReturnValue('#FFFFFF'),
    nombreLocal: vi.fn().mockReturnValue(''),
    logoUrl: vi.fn().mockReturnValue(null),
    fontTitulo: vi.fn().mockReturnValue(''),
    fontCuerpo: vi.fn().mockReturnValue(''),
    cargar: vi.fn(),
  };

  const platoServiceMock = {
    getArticuloComensal: vi.fn().mockReturnValue(
      of({
        ingredientesOpcionales: [
          { nombre: 'Queso', ingredienteId: 1 },
          { nombre: 'Tomate', ingredienteId: 2 },
        ],
      }),
    ),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(history, 'state', 'get').mockReturnValue({
      plato: {
        plato: { id: 1, nombre: 'Milanesa', precio: 800 },
        cantidad: 1,
      },
      index: 0,
    });

    await TestBed.configureTestingModule({
      imports: [PersonalizarPlato],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: PedidoState, useValue: pedidoStateMock },
        { provide: ComandaState, useValue: comandaStateMock },
        { provide: ComensalState, useValue: comensalStateMock },
        { provide: ConfiguracionVisualState, useValue: configuracionVisualStateMock },
        { provide: PlatoService, useValue: platoServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PersonalizarPlato);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar ingredientes opcionales en ngOnInit', () => {
    component.ngOnInit();

    expect(platoServiceMock.getArticuloComensal).toHaveBeenCalledWith(1, 1);
    expect(component.ingredientesOpcionales.length).toBe(2);
    expect(component.seleccionados).toEqual(['Queso', 'Tomate']);
  });

  it('debería toggle ingrediente (agregar si no está)', () => {
    component.seleccionados = [];

    component.toggleIngrediente('Queso');

    expect(component.seleccionados).toContain('Queso');
  });

  it('debería toggle ingrediente (sacar si ya está)', () => {
    component.seleccionados = ['Queso', 'Tomate'];

    component.toggleIngrediente('Queso');

    expect(component.seleccionados).not.toContain('Queso');
    expect(component.seleccionados).toContain('Tomate');
  });

  it('debería guardar cambios actualizando item existente', () => {
    component.plato = { plato: { id: 1 }, cantidad: 1 } as any;
    component.itemIndex = 0;
    component.ingredientesOpcionales = [
      { nombre: 'Queso', ingredienteId: 1 },
      { nombre: 'Tomate', ingredienteId: 2 },
    ];
    component.seleccionados = ['Queso'];
    component.observaciones = 'Sin sal';

    component.guardarCambios();

    expect(pedidoStateMock.actualizarItemEnIndice).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        observacionesIngredientes: [2],
        observacionesGenerales: 'Sin sal',
      }),
    );
    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/detalle-pedido']);
  });

  it('debería guardar cambios agregando nuevo pedido si no hay index', () => {
    component.plato = { plato: { id: 1 }, cantidad: 1 } as any;
    component.itemIndex = -1;
    component.seleccionados = ['Queso', 'Tomate'];
    component.observaciones = '';

    component.guardarCambios();

    expect(pedidoStateMock.agregarPedido).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/detalle-pedido']);
  });

  it('debería volver atrás', () => {
    component.volver();
  });
});
