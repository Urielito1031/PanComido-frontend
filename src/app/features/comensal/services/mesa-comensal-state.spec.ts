import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { MesaComensalState } from './mesa-comensal-state';
import { MesaComensalService } from './mesa-comensal.service';
import { BienvenidaResponseDto } from '../../../core/models/dtos/responses/bienvenida.response';

describe('MesaComensalState', () => {
  let state: MesaComensalState;
  let serviceMock: { obtenerBienvenida: ReturnType<typeof vi.fn>; obtenerBienvenidaInvitado: ReturnType<typeof vi.fn> };

  const mockBienvenida: BienvenidaResponseDto = {
    idMesa: 3,
    numeroMesa: 7,
    restauranteId: 1,
    cantidadMaximaComensales: 6,
    estadoActual: 'Disponible',
  };

  const mockBienvenidaInvitado = {
    comandaId: 42,
    idMesa: 3,
    numeroMesa: 7,
    cantComensales: 4,
    restauranteId: 1,
  };

  beforeEach(() => {
    serviceMock = {
      obtenerBienvenida: vi.fn(),
      obtenerBienvenidaInvitado: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MesaComensalState,
        { provide: MesaComensalService, useValue: serviceMock },
      ],
    });

    state = TestBed.inject(MesaComensalState);
  });

  it('debería crearse correctamente', () => {
    expect(state).toBeTruthy();
  });

  describe('initial state', () => {
    it('debería tener bienvenida nula inicialmente', () => {
      expect(state.bienvenida()).toBeNull();
      expect(state.bienvenidaInvitado()).toBeNull();
      expect(state.cargando()).toBe(false);
      expect(state.error()).toBeNull();
      expect(state.tieneError()).toBe(false);
    });

    it('debería tener flags en falso inicialmente', () => {
      expect(state.bienvenidaCargada()).toBe(false);
      expect(state.mesaDisponible()).toBe(false);
      expect(state.bienvenidaInvitadoCargada()).toBe(false);
    });
  });

  describe('cargarBienvenida', () => {
    it('debería alternar cargando durante el ciclo de la request', () => {
      expect(state.cargando()).toBe(false);
      serviceMock.obtenerBienvenida.mockReturnValue(of(mockBienvenida));
      state.cargarBienvenida(3, 1);
      expect(state.cargando()).toBe(false);
    });

    it('debería actualizar bienvenida y señales computadas al tener éxito', () => {
      serviceMock.obtenerBienvenida.mockReturnValue(of(mockBienvenida));

      state.cargarBienvenida(3, 1);

      expect(state.bienvenida()).toEqual(mockBienvenida);
      expect(state.mesaId()).toBe(3);
      expect(state.numeroMesa()).toBe(7);
      expect(state.restauranteIdBienvenida()).toBe(1);
      expect(state.cantidadMaximaComensales()).toBe(6);
      expect(state.estadoActual()).toBe('Disponible');
      expect(state.bienvenidaCargada()).toBe(true);
      expect(state.mesaDisponible()).toBe(true);
      expect(state.cargando()).toBe(false);
      expect(state.error()).toBeNull();
      expect(state.tieneError()).toBe(false);
    });

    it('debería setear error al fallar', () => {
      serviceMock.obtenerBienvenida.mockReturnValue(
        throwError(() => ({ error: { error: 'Mesa no encontrada' } })),
      );

      state.cargarBienvenida(99, 1);

      expect(state.bienvenida()).toBeNull();
      expect(state.error()).toBe('Mesa no encontrada');
      expect(state.tieneError()).toBe(true);
      expect(state.cargando()).toBe(false);
    });

    it('debería usar err.message como mensaje de error fallback', () => {
      serviceMock.obtenerBienvenida.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      state.cargarBienvenida(1, 1);

      expect(state.error()).toBe('Network error');
    });

    it('debería usar fallback genérico cuando no hay información de error', () => {
      serviceMock.obtenerBienvenida.mockReturnValue(throwError(() => ({})));

      state.cargarBienvenida(1, 1);

      expect(state.error()).toBe('Error al cargar la mesa');
    });

    it('debería limpiar error anterior en nueva request', () => {
      serviceMock.obtenerBienvenida.mockReturnValueOnce(
        throwError(() => ({ error: { error: 'Error anterior' } })),
      );
      state.cargarBienvenida(1, 1);
      expect(state.tieneError()).toBe(true);

      serviceMock.obtenerBienvenida.mockReturnValue(of(mockBienvenida));
      state.cargarBienvenida(3, 1);

      expect(state.error()).toBeNull();
      expect(state.tieneError()).toBe(false);
    });
  });

  describe('cargarBienvenidaInvitado', () => {
    it('debería setear cargando=false después de completar la request', () => {
      serviceMock.obtenerBienvenidaInvitado.mockReturnValue(of(mockBienvenidaInvitado));
      state.cargarBienvenidaInvitado(42);
      expect(state.cargando()).toBe(false);
    });

    it('debería actualizar bienvenidaInvitado al tener éxito', () => {
      serviceMock.obtenerBienvenidaInvitado.mockReturnValue(of(mockBienvenidaInvitado));

      state.cargarBienvenidaInvitado(42);

      expect(state.bienvenidaInvitado()).toEqual(mockBienvenidaInvitado);
      expect(state.comandaIdInvitado()).toBe(42);
      expect(state.mesaIdInvitado()).toBe(3);
      expect(state.numeroMesaInvitado()).toBe(7);
      expect(state.cantComensalesInvitado()).toBe(4);
      expect(state.restauranteIdInvitado()).toBe(1);
      expect(state.bienvenidaInvitadoCargada()).toBe(true);
    });

    it('debería setear error al fallar para invitado', () => {
      serviceMock.obtenerBienvenidaInvitado.mockReturnValue(
        throwError(() => ({ error: { mensaje: 'Invitación no válida' } })),
      );

      state.cargarBienvenidaInvitado(999);

      expect(state.error()).toBe('Invitación no válida');
      expect(state.tieneError()).toBe(true);
    });

    it('debería usar err.message como fallback para error de invitado', () => {
      serviceMock.obtenerBienvenidaInvitado.mockReturnValue(
        throwError(() => new Error('Falló la conexión')),
      );

      state.cargarBienvenidaInvitado(1);

      expect(state.error()).toBe('Falló la conexión');
    });

    it('debería usar fallback genérico para error de invitado', () => {
      serviceMock.obtenerBienvenidaInvitado.mockReturnValue(throwError(() => ({})));

      state.cargarBienvenidaInvitado(1);

      expect(state.error()).toBe('Error al cargar invitación');
    });
  });

  describe('computed signals for edge cases', () => {
    it('debería devolver valores computados nulos cuando bienvenida es null', () => {
      expect(state.mesaId()).toBeNull();
      expect(state.numeroMesa()).toBeNull();
      expect(state.restauranteIdBienvenida()).toBeNull();
      expect(state.cantidadMaximaComensales()).toBeNull();
      expect(state.estadoActual()).toBeNull();
    });

    it('debería devolver valores computados nulos de invitado cuando bienvenidaInvitado es null', () => {
      expect(state.comandaIdInvitado()).toBeNull();
      expect(state.mesaIdInvitado()).toBeNull();
      expect(state.numeroMesaInvitado()).toBeNull();
      expect(state.cantComensalesInvitado()).toBeNull();
      expect(state.restauranteIdInvitado()).toBeNull();
    });

    it('debería reportar mesa no disponible cuando estado es Ocupada', () => {
      serviceMock.obtenerBienvenida.mockReturnValue(
        of({ ...mockBienvenida, estadoActual: 'Ocupada' }),
      );
      state.cargarBienvenida(3, 1);
      expect(state.mesaDisponible()).toBe(false);
    });
  });
});
