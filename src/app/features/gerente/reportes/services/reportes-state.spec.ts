import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReporteService } from '../../services/reporte.service';
import { ReportesState } from './reportes-state';

describe('ReportesState', () => {
  let state: ReportesState;
  let reporteServiceMock: {
    descargarReporteDashboard: ReturnType<typeof vi.fn>;
    descargarReporteVentas: ReturnType<typeof vi.fn>;
    descargarReportePersonal: ReturnType<typeof vi.fn>;
  };
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();

    reporteServiceMock = {
      descargarReporteDashboard: vi.fn(),
      descargarReporteVentas: vi.fn(),
      descargarReportePersonal: vi.fn()
    };

    createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
    revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      providers: [
        ReportesState,
        { provide: ReporteService, useValue: reporteServiceMock }
      ]
    });

    state = TestBed.inject(ReportesState);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debería validar rangos completos, ordenados y no futuros', () => {
    expect(state.rangoValido).toBe(false);

    state.setFechaDesde('2026-07-01');
    state.setFechaHasta('2026-07-06');
    expect(state.rangoValido).toBe(true);

    state.setFechaDesde('2026-07-07');
    state.setFechaHasta('2026-07-06');
    expect(state.rangoValido).toBe(false);

    state.setFechaDesde('2026-07-01');
    state.setFechaHasta('2999-01-01');
    expect(state.rangoValido).toBe(false);
  });

  it('no debería descargar dashboard ni ventas si el rango es inválido', () => {
    state.descargarDashboard();
    state.descargarVentas();

    expect(reporteServiceMock.descargarReporteDashboard).not.toHaveBeenCalled();
    expect(reporteServiceMock.descargarReporteVentas).not.toHaveBeenCalled();
    expect(state.estadoDashboard()).toBe('idle');
    expect(state.estadoVentas()).toBe('idle');
  });

  it('debería descargar dashboard, disparar archivo y volver a idle tras éxito', () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' });
    reporteServiceMock.descargarReporteDashboard.mockReturnValue(of(blob));
    state.setFechaDesde('2026-07-01');
    state.setFechaHasta('2026-07-06');

    state.descargarDashboard();

    expect(reporteServiceMock.descargarReporteDashboard).toHaveBeenCalledWith('2026-07-01', '2026-07-06');
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:test');
    expect(state.estadoDashboard()).toBe('exito');

    vi.advanceTimersByTime(3000);
    expect(state.estadoDashboard()).toBe('idle');
  });

  it('debería marcar error al fallar la descarga de ventas y limpiar el estado', () => {
    reporteServiceMock.descargarReporteVentas.mockReturnValue(throwError(() => new Error('fallo')));
    state.setFechaDesde('2026-07-01');
    state.setFechaHasta('2026-07-06');

    state.descargarVentas();

    expect(reporteServiceMock.descargarReporteVentas).toHaveBeenCalledWith('2026-07-01', '2026-07-06');
    expect(state.estadoVentas()).toBe('error');

    vi.advanceTimersByTime(4000);
    expect(state.estadoVentas()).toBe('idle');
  });

  it('debería descargar personal sin requerir rango de fechas', () => {
    const blob = new Blob(['personal'], { type: 'application/pdf' });
    reporteServiceMock.descargarReportePersonal.mockReturnValue(of(blob));

    state.descargarPersonal();

    expect(reporteServiceMock.descargarReportePersonal).toHaveBeenCalled();
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
    expect(state.estadoPersonal()).toBe('exito');

    vi.advanceTimersByTime(3000);
    expect(state.estadoPersonal()).toBe('idle');
  });
});
