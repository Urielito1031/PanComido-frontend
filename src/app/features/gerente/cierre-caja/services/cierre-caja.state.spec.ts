import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CierreCajaStateService } from './cierre-caja.state';
import { CierreCajaApiService } from './cierre-caja.api';
import { ConfiguracionService } from '../../configuracion/services/configuracion-service';

describe('CierreCajaStateService', () => {
  let service: CierreCajaStateService;
  let apiMock: any;
  let configuracionApiMock: any;

  const cierreDto = {
    fecha: '2026-06-18',
    turnoLaboralId: 1,
    turnoLaboralNombre: 'Turno Día',
    cantidadTotalDePagos: 12,
    totalRecaudado: 45000,
    detallePagos: [
      { metodoPagoId: 1, metodoPagoNombre: 'Efectivo', cantidadPagos: 5, total: 15000 }
    ],
    diferencia: 0,
    sobrante: 0
  };

  beforeEach(() => {
    apiMock = {
      generarCierre: vi.fn().mockReturnValue(of(cierreDto)),
      getHistorial: vi.fn().mockReturnValue(of([cierreDto]))
    };
    configuracionApiMock = {
      obtenerTurnos: vi.fn().mockReturnValue(of([
        { id: 1, restauranteId: 1, horarioInicio: '07:00', horarioFin: '19:00', esNocturno: false },
        { id: 2, restauranteId: 1, horarioInicio: '19:00', horarioFin: '01:00', esNocturno: true }
      ]))
    };

    TestBed.configureTestingModule({
      providers: [
        CierreCajaStateService,
        { provide: CierreCajaApiService, useValue: apiMock },
        { provide: ConfiguracionService, useValue: configuracionApiMock }
      ]
    });

    service = TestBed.inject(CierreCajaStateService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería cargar turnos e historial al llamar a cargarDatos', () => {
    service.cargarDatos();
    expect(configuracionApiMock.obtenerTurnos).toHaveBeenCalled();
    expect(apiMock.getHistorial).toHaveBeenCalled();
    expect(service.turnoDiaId()).toBe(1);
    expect(service.turnoNocheId()).toBe(2);
    expect(service.historial()).toHaveLength(1);
  });

  it('debería abrir y cerrar el modal de cierre', () => {
    service.abrirCierre('dia');
    expect(service.turnoSeleccionado()).toBe('dia');
    expect(service.conteoCaja()).toBe(0);

    service.setConteoCaja(1000);
    expect(service.conteoCaja()).toBe(1000);

    service.cerrarModalCierre();
    expect(service.turnoSeleccionado()).toBeNull();
  });

  it('debería confirmar el cierre del turno día', () => {
    service.cargarDatos();
    service.abrirCierre('dia');
    service.setConteoCaja(45000);

    service.confirmarCierre();

    expect(apiMock.generarCierre).toHaveBeenCalledWith({ idTurnoLaboral: 1, conteoCaja: 45000 });
    expect(service.cierreGenerado()?.turnoLaboralNombre).toBe('Turno Día');
    expect(service.turnoSeleccionado()).toBeNull();
  });

  it('debería mostrar el mensaje de error cuando el turno todavía está en curso (409)', () => {
    service.cargarDatos();
    apiMock.generarCierre.mockReturnValue(throwError(() => ({ status: 409, error: { mensaje: 'El turno todavía está en curso' } })));
    service.abrirCierre('noche');
    service.setConteoCaja(1000);

    service.confirmarCierre();

    expect(service.error()).toBe('El turno todavía está en curso');
    expect(service.cierreGenerado()).toBeNull();
  });

  it('debería alternar el modal de detalle de cierre histórico', () => {
    const cierre = { ...cierreDto } as any;
    service.abrirDetalleCierre(cierre);
    expect(service.cierreDetalle()).toEqual(cierre);

    service.cerrarDetalleCierre();
    expect(service.cierreDetalle()).toBeNull();
  });
});
