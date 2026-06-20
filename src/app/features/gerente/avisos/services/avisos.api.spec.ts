import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AvisosApiService } from './avisos.api';
import { ApiService } from '../../../../core/services/api-service';
import { vi } from 'vitest';

describe('AvisosApiService', () => {
  let service: AvisosApiService;
  let apiServiceMock: any;

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AvisosApiService,
        { provide: ApiService, useValue: apiServiceMock }
      ]
    });

    service = TestBed.inject(AvisosApiService);
  });

  it('debería crearse', () => {
    expect(service).toBeTruthy();
  });

  it('getAvisos debería hacer un GET a "avisos"', () => {
    apiServiceMock.get.mockReturnValue(of({}));
    service.getAvisos().subscribe();
    expect(apiServiceMock.get).toHaveBeenCalledWith('avisos');
  });

  it('getPlatos debería hacer un GET a "platos"', () => {
    apiServiceMock.get.mockReturnValue(of([]));
    service.getPlatos().subscribe();
    expect(apiServiceMock.get).toHaveBeenCalledWith('platos');
  });

  it('updatePlato debería hacer un PUT a "/platos/{id}"', () => {
    apiServiceMock.put.mockReturnValue(of({}));
    const payload = { nombre: 'Papas' };
    service.updatePlato(1, payload).subscribe();
    expect(apiServiceMock.put).toHaveBeenCalledWith('/platos/1', payload);
  });

  it('getInsumos debería hacer un GET a "insumo"', () => {
    apiServiceMock.get.mockReturnValue(of([]));
    service.getInsumos().subscribe();
    expect(apiServiceMock.get).toHaveBeenCalledWith('insumo');
  });

  it('generarSugerenciasIA debería hacer un POST a "avisos/sugerencias-ia" y mapear respuesta', () => {
    const mockDto = {
      fechaSugerencia: '2026-06-18',
      platosSugeridos: [
        {
          id: 1,
          nombre: 'Sugerencia 1',
          descripcion: 'Desc',
          tiempoPreparacion: 10,
          porcionesPosibles: 5,
          ingredientesSugeridosIA: [
            { insumoId: 1, nombre: 'Sal', cantidad: 10 }
          ]
        }
      ]
    };
    apiServiceMock.post.mockReturnValue(of(mockDto));
    
    service.generarSugerenciasIA().subscribe(result => {
      expect(result.fechaSugerencia).toBe('2026-06-18');
      expect(result.platosSugeridos).toHaveLength(1);
      expect(result.platosSugeridos[0].ingredientesSugeridos[0].nombre).toBe('Sal');
    });
    
    expect(apiServiceMock.post).toHaveBeenCalledWith('avisos/sugerencias-ia', {});
  });

  it('crearPlatoDesdeIA debería hacer un POST a "plato"', () => {
    const payload: any = { nombre: 'Nuevo plato' };
    apiServiceMock.post.mockReturnValue(of({}));
    service.crearPlatoDesdeIA(payload).subscribe();
    expect(apiServiceMock.post).toHaveBeenCalledWith('plato', payload);
  });
});
