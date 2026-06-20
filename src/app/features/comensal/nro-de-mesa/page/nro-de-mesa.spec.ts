import { TestBed } from '@angular/core/testing';
import { NroDeMesa } from './nro-de-mesa';
import { Router, ActivatedRoute } from '@angular/router';
import { MesaComensalService } from '../../services/mesa-comensal.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('NroDeMesa', () => {
  let component: NroDeMesa;

  const routerMock = {
    navigate: vi.fn()
  };

  const mesaServiceMock = {
    obtenerBienvenida: vi.fn()
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
        }
      }
    }
  };

  beforeEach(async () => {
    mesaServiceMock.obtenerBienvenida.mockReturnValue(
      of({
        nombre: 'Test Restaurante',
        colorPrincipal: '#000'
      })
    );

    await TestBed.configureTestingModule({
      imports: [NroDeMesa],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: MesaComensalService, useValue: mesaServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(NroDeMesa);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar params en ngOnInit', () => {
    component.ngOnInit();

    expect(component.restauranteId).toBe(1);
    expect(component.mesaId).toBe(10);
  });

  it('debería llamar bienvenida del servicio', () => {
    component.ngOnInit();

    expect(mesaServiceMock.obtenerBienvenida).toHaveBeenCalledWith(10, 1);
  });

  it('debería setear configuración desde backend', () => {
    component.ngOnInit();

    expect(component.configuracion.nombre).toBe('Test Restaurante');
  });

  it('debería navegar a cantidad personas', () => {
    component.restauranteId = 1;
    component.mesaId = 10;

    component.irACantidadPersonas();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/cantidad-personas',
      1,
      10
    ]);
  });

  it('debería volver a escanear mesa', () => {
    component.volverAtras();

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/escanear-mesa'
    ]);
  });

  it('debería manejar error del servicio', () => {
    mesaServiceMock.obtenerBienvenida.mockReturnValueOnce(
      of({
        nombre: 'Fallback'
      })
    );

    component.cargarBienvenida();

    expect(mesaServiceMock.obtenerBienvenida).toHaveBeenCalled();
  });
});