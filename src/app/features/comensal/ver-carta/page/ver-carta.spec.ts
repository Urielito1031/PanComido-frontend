import { TestBed } from '@angular/core/testing';
import { VerCarta } from './ver-carta';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoState } from '../../services/pedido.state';
import { CartaState } from '../service/carta-state';
import { ComensalState } from '../../services/comensal-state';
import { vi } from 'vitest';

describe('VerCarta', () => {
  let component: VerCarta;

  const routerMock = {
    navigate: vi.fn()
  };

  const pedidoStateMock = {
    agregarPedido: vi.fn(),
    cantidadTotal: 0,
    totalPrecio: 0
  };

  const cartaStateMock = {
    cargarCarta: vi.fn(),
    setBusqueda: vi.fn(),
    setOrdenar: vi.fn()
  };

  const comensalStateMock = {};

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerCarta],
      providers: [
        {
          provide: Router,
          useValue: routerMock
        },
        {
          provide: PedidoState,
          useValue: pedidoStateMock
        },
        {
          provide: CartaState,
          useValue: cartaStateMock
        },
        {
          provide: ComensalState,
          useValue: comensalStateMock
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  const map: any = {
                    mesaId: '1',
                    cantidadPersonas: '2',
                    restauranteId: '10'
                  };
                  return map[key];
                }
              }
            }
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(VerCarta);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería llamar a cargarCarta al iniciar', () => {
    component.ngOnInit();
    expect(cartaStateMock.cargarCarta).toHaveBeenCalled();
  });

  it('debería actualizar búsqueda en estado', () => {
    component.onSearch('pizza');
    expect(cartaStateMock.setBusqueda).toHaveBeenCalledWith('pizza');
  });

  it('debería seleccionar orden', () => {
    component.seleccionarOrden('precio', 'Precio');

    expect(component.ordenSeleccionado()).toBe('Precio');
    expect(cartaStateMock.setOrdenar).toHaveBeenCalledWith('precio');
  });

  it('debería agregar un item al pedido', () => {
    const item = { id: 1, nombre: 'Pizza' } as any;

    component.agregarAlPedido(item);

    expect(pedidoStateMock.agregarPedido).toHaveBeenCalledWith(item);
  });

  it('debería navegar a detalle pedido', () => {
    component.irAPedido();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/comensal/detalle-pedido']);
  });

  it('debería togglear menú ordenar', () => {
    const initial = component.menuOrdenarAbierto();

    component.toggleMenuOrdenar();

    expect(component.menuOrdenarAbierto()).toBe(!initial);
  });
});