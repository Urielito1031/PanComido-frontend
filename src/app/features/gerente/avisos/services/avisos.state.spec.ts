import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Plato } from '../../../../core/models/domain/plato';
import { AvisosApiService } from './avisos.api';
import { AvisosStateService } from './avisos.state';

describe('AvisosStateService', () => {
  let service: AvisosStateService;
  let apiMock: any;

  const platos: Plato[] = [
    {
      id: 1,
      nombre: 'Risotto a la crema',
      precioVenta: 12000,
      costo: 7000,
      visible: false,
      imagen: '',
      tipo: 'Principales',
      receta: []
    },
    {
      id: 2,
      nombre: 'Milanesa',
      precioVenta: 10000,
      costo: 5000,
      visible: true,
      imagen: '',
      tipo: 'Principales',
      receta: []
    }
  ];

  beforeEach(() => {
    apiMock = {
      getAvisos: vi.fn().mockReturnValue(of({ data: [], meta: {}})),
      getInsumos: vi.fn().mockReturnValue(of([])),
      getPlatos: vi.fn().mockReturnValue(of(platos)),
      updatePlato: vi.fn().mockImplementation((id: number, data: Partial<Plato>) =>
        of({ ...platos.find(plato => plato.id === id)!, ...data })
      ),
      generarSugerenciasIA: vi.fn().mockReturnValue(of({
        fechaSugerencia: '2026-06-18',
        platosSugeridos: []
      })),
      crearPlatoDesdeIA: vi.fn().mockReturnValue(of({}))
    };

    TestBed.configureTestingModule({
      providers: [
        AvisosStateService,
        { provide: AvisosApiService, useValue: apiMock }
      ]
    });

    service = TestBed.inject(AvisosStateService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería cargar sugerencias de cocina', () => {
    service.cargarSugerenciasCocina();
    expect(apiMock.getPlatos).toHaveBeenCalled();
    // Sugerencias = platos no visibles
    expect(service.sugerencias()).toHaveLength(1);
    expect(service.sugerencias()[0].nombre).toBe('Risotto a la crema');
  });

  it('debería ignorar una sugerencia', () => {
    service.cargarSugerenciasCocina();
    service.ignorarSugerencia(platos[0]);
    expect(service.sugerencias()).toHaveLength(0); // Fue ignorada
    expect(service.mensaje()).toBe('Sugerencia descartada');
  });

  it('debería agregar una sugerencia a la carta y hacerla visible', () => {
    service.cargarSugerenciasCocina();
    service.agregarSugerenciaACarta(platos[0]);
    expect(apiMock.updatePlato).toHaveBeenCalledWith(1, { visible: true });
    expect(service.sugerencias()).toHaveLength(0); // Ya es visible, sale de sugerencias
    expect(service.platoAgregadoACarta()?.id).toBe(1);
  });

  it('debería generar sugerencias IA', () => {
    service.generarSugerenciasIA();
    expect(apiMock.generarSugerenciasIA).toHaveBeenCalled();
    expect(service.sugerenciasIA()?.fechaSugerencia).toBe('2026-06-18');
    expect(service.loadingIA()).toBe(false);
  });

  it('debería manejar error en generar sugerencias IA', () => {
    apiMock.generarSugerenciasIA.mockReturnValue(throwError(() => new Error('Error')));
    service.generarSugerenciasIA();
    expect(service.errorIA()).toBeTruthy();
    expect(service.loadingIA()).toBe(false);
  });

  it('debería crear un plato desde la sugerencia IA', () => {
    const mockSugerencia = {
      id: 1,
      nombre: 'Nuevo Plato IA',
      descripcion: 'Desc',
      tiempoPreparacion: 10,
      porcionesPosibles: 5,
      ingredientesSugeridos: []
    };
    
    vi.useFakeTimers();
    service.crearPlatoDesdeIA(mockSugerencia);
    expect(apiMock.crearPlatoDesdeIA).toHaveBeenCalled();
    expect(service.platoIACreado()).toBe('Nuevo Plato IA');
    vi.advanceTimersByTime(3000);
    expect(service.platoIACreado()).toBeNull();
    vi.useRealTimers();
  });
});
