import { TestBed } from '@angular/core/testing';
import { MesaService } from './mesa.service';
import { ApiService } from '../../../core/services/api-service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('MesaService', () => {
  let service: MesaService;
  let apiServiceMock: any;

  beforeEach(() => {
    apiServiceMock = {
      get: vi.fn().mockReturnValue(of([])),
      post: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({}))
    };

    TestBed.configureTestingModule({
      providers: [
        MesaService,
        { provide: ApiService, useValue: apiServiceMock }
      ]
    });
    service = TestBed.inject(MesaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('debería llamar al get para traer mozos', () => {
    const mozosMock = [{ id: 1, nombre: 'Pepe' }];
    apiServiceMock.get.mockReturnValue(of(mozosMock));

    service.getMozos().subscribe(mozos => {
      expect(mozos).toEqual(mozosMock);
    });

    expect(apiServiceMock.get).toHaveBeenCalledWith('mesa/mozos');
  });

  it('debería hacer post para asignar mozos', () => {
    service.asignarMozos(1, [1, 2]).subscribe();
    expect(apiServiceMock.post).toHaveBeenCalledWith('mesa/1/mozos', [1, 2]);
  });
});
