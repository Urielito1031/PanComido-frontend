import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { ModificarCartaComponent } from './modificar-carta';
import { ModificarCartaStateService } from '../services/modificar-carta.state';
import { Plato } from '../../../../core/models/domain/plato';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

describe('ModificarCartaComponent', () => {
  let component: ModificarCartaComponent;
  let fixture: ComponentFixture<ModificarCartaComponent>;
  let stateServiceMock: any;
  let routerMock: any;
  let activatedRouteMock: any;
  let queryParamsSubject: BehaviorSubject<Record<string, string>>;
  let fragmentSubject: BehaviorSubject<string | null>;

  const mockPlatos: Plato[] = [
    { id: 1, nombre: 'Milanesa', precioVenta: 100, costo: 50, visible: true, receta: [], imagen: '' }
  ];

  beforeEach(async () => {
    Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });

    // 1. Mockear Signals y Métodos del State Service
    stateServiceMock = {
      platos: signal(mockPlatos),
      filteredPlatos: signal(mockPlatos),
      platosRecomendados: signal([]),
      platosComidas: signal([]),
      platosBebidas: signal([]),
      explodingPlatoId: signal<number | null>(null),
      platoAEditar: signal<Plato | null>(null),
      platoAEliminar: signal<Plato | null>(null),
      bebidaAEditar: signal<{ id: number; costo: number; categoriaInsumoId: number | null; detalle: unknown } | null>(null),
      selectedCategoria: signal<string | null>(null),
      loading: signal<boolean>(false),
      categoriasDisponibles: signal([]),
      tiposBebidaDisponibles: signal([]),
      selectedTipoBebida: signal<string | null>(null),
      totalBebidasCount: signal(0),
      tiposComidaDisponibles: signal([]),
      selectedTipoComida: signal<string | null>(null),
      totalComidasCount: signal(0),
      sortOrder: signal<'default' | 'ventas-desc' | 'ventas-asc'>('default'),
      searchTerm: signal(''),
      mostrarModalRestaurar: signal(false),
      mostrarModalImportar: signal(false),
      porcentajesPlatos: signal([]),
      porcentajesBebidas: signal([]),

      cargarPlatos: vi.fn(),
      cargarPorcentajes: vi.fn(),
      setTipoBebida: vi.fn(),
      setTipoComida: vi.fn(),
      setSortOrder: vi.fn(),
      toggleRecomendado: vi.fn(),
      setSearchTerm: vi.fn(),
      toggleVisibility: vi.fn(),
      setPlatoAEditar: vi.fn(),
      setPlatoAEliminar: vi.fn(),
      setBebidaAEditar: vi.fn(),
      saveBebida: vi.fn(),
      savePlato: vi.fn(),
      confirmDelete: vi.fn(),
      closeModals: vi.fn(),
      setCategoria: vi.fn()
    };

    // 2. Mockear Router e ActivatedRoute
    routerMock = {
      navigate: vi.fn()
    };

    queryParamsSubject = new BehaviorSubject<Record<string, string>>({});
    fragmentSubject = new BehaviorSubject<string | null>(null);
    activatedRouteMock = {
      queryParams: queryParamsSubject.asObservable(),
      fragment: fragmentSubject.asObservable()
    };

    // 3. Configurar TestBed
    await TestBed.configureTestingModule({
      imports: [ModificarCartaComponent],
      providers: [
        { provide: ModificarCartaStateService, useValue: stateServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    })
    // Ignorar subcomponentes complejos en test unitario puro
    .overrideComponent(ModificarCartaComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModificarCartaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería llamar a cargarPlatos del state al inicializar', () => {
    expect(stateServiceMock.cargarPlatos).toHaveBeenCalled();
  });

  it('debería delegar onTipoBebidaSeleccionado al state', () => {
    component.onTipoBebidaSeleccionado('Cerveza');
    expect(stateServiceMock.setTipoBebida).toHaveBeenCalledWith('Cerveza');
  });

  it('debería delegar onTipoComidaSeleccionado al state', () => {
    component.onTipoComidaSeleccionado('Principal');
    expect(stateServiceMock.setTipoComida).toHaveBeenCalledWith('Principal');
  });


  it('debería delegar toggleRecomendado al state', () => {
    component.toggleRecomendado(mockPlatos[0]);
    expect(stateServiceMock.toggleRecomendado).toHaveBeenCalledWith(mockPlatos[0]);
  });

  it('debería delegar onSearch al state', () => {
    component.onSearch('Milanesa');
    expect(stateServiceMock.setSearchTerm).toHaveBeenCalledWith('Milanesa');
  });

  it('debería limpiar la búsqueda al entrar a carta sin query buscar', () => {
    expect(stateServiceMock.setSearchTerm).toHaveBeenCalledWith('');
  });

  it('debería abrir edición cuando llega el plato buscado desde query params', () => {
    stateServiceMock.setPlatoAEditar.mockClear();
    stateServiceMock.platos.set([]);

    queryParamsSubject.next({ buscar: 'Milanesa', editar: 'true' });
    expect(stateServiceMock.setSearchTerm).toHaveBeenCalledWith('Milanesa');
    expect(stateServiceMock.setPlatoAEditar).not.toHaveBeenCalled();

    stateServiceMock.platos.set(mockPlatos);
    fixture.detectChanges();

    expect(stateServiceMock.setPlatoAEditar).toHaveBeenCalledWith(mockPlatos[0]);
  });

  it('debería delegar toggleVisibility al state', () => {
    component.toggleVisibility(mockPlatos[0]);
    expect(stateServiceMock.toggleVisibility).toHaveBeenCalledWith(mockPlatos[0]);
  });

  it('debería delegar onEditPlato al state', () => {
    component.onEditPlato(mockPlatos[0]);
    expect(stateServiceMock.setPlatoAEditar).toHaveBeenCalledWith(mockPlatos[0]);
  });

  it('debería delegar onDeletePlato al state', () => {
    component.onDeletePlato(mockPlatos[0]);
    expect(stateServiceMock.setPlatoAEliminar).toHaveBeenCalledWith(mockPlatos[0]);
  });

  it('debería delegar onSavePlato al state', () => {
    const payload = { nombre: 'Mila' };
    component.onSavePlato(payload);
    expect(stateServiceMock.savePlato).toHaveBeenCalledWith(payload);
  });

  it('debería delegar onConfirmDelete al state', () => {
    component.onConfirmDelete();
    expect(stateServiceMock.confirmDelete).toHaveBeenCalled();
  });

  it('debería delegar onCloseModals al state', () => {
    component.onCloseModals();
    expect(stateServiceMock.closeModals).toHaveBeenCalled();
  });

  it('debería delegar onCategoriaSeleccionada al state', () => {
    component.onCategoriaSeleccionada('Bebidas');
    expect(stateServiceMock.setCategoria).toHaveBeenCalledWith('Bebidas');
  });

  it('debería navegar a crear plato al invocar irACrearPlato', () => {
    component.irACrearPlato();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff/gerente/crear-plato']);
  });

  it('debería mutar la señal layoutMode al invocar setLayoutMode', () => {
    expect(component.layoutMode()).toBe('grid');
    component.setLayoutMode('list');
    expect(component.layoutMode()).toBe('list');
  });
});
