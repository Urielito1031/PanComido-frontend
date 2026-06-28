import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapaMesas } from './mapa-mesas';
import { MesaState } from '../../services/mesa.state';
import { AuthService } from '../../../../core/services/auth.service';
import { MesaService } from '../../services/mesa.service';
import { signal } from '@angular/core';
import { vi } from 'vitest';

describe('MapaMesas', () => {
  let component: MapaMesas;
  let fixture: ComponentFixture<MapaMesas>;
  let mockState: any;
  let mockAuth: any;
  let mockMesaService: any;

  beforeEach(async () => {
    mockState = {
      cargarMesas: vi.fn(),
      mesas: signal([]),
      mesaSeleccionada: signal(null),
      notificacion: signal(null),
      seleccionarMesa: vi.fn(),
      ocuparMesa: vi.fn(),
      isEditorMode: signal(false),
      mostrarNotificacion: vi.fn(),
    };

    mockAuth = {
      restauranteId: 1,
      empleadoId: 1,
      rol: vi.fn().mockReturnValue('Gerente'),
      tieneRoles: vi.fn().mockReturnValue(true),
    };

    mockMesaService = {
      getMozos: vi.fn().mockReturnValue({ subscribe: (cb: any) => cb([{ id: 1, nombre: 'Pepe' }]) }),
      asignarMozos: vi.fn().mockReturnValue({ subscribe: (cfg: any) => cfg.next() })
    };

    await TestBed.configureTestingModule({
      imports: [MapaMesas],
      providers: [
        { provide: MesaState, useValue: mockState },
        { provide: AuthService, useValue: mockAuth },
        { provide: MesaService, useValue: mockMesaService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapaMesas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call cargarMesas on init', () => {
    expect(mockState.cargarMesas).toHaveBeenCalled();
  });

  it('should select and deselect mobile mesa', () => {
    const mesa = { id: 1, numeroMesa: 1 } as any;
    component.seleccionarMesaMobile(mesa);
    expect(component.mesaMobileSeleccionada()).toEqual(mesa);
    component.volverGridMobile();
    expect(component.mesaMobileSeleccionada()).toBeNull();
  });

  it('debería guardar asignación de mozos', () => {
    component.mesaSeleccionadaId.set(1);
    component.mozosSeleccionadosIds.set([1, 2]);
    component.guardarAsignacionMozos();

    expect(mockState.mostrarNotificacion).toHaveBeenCalledWith('Mozos asignados correctamente', 'exito');
    expect(mockState.cargarMesas).toHaveBeenCalled();
  });
});
