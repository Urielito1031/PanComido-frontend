import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CierreCajaStateService } from './cierre-caja.state';
import { CierreCajaApiService } from './cierre-caja.api';
import { BrowserNavigationService } from '../../../../core/services/browser-navigation.service';
import { environment } from '../../../../../environments/environment';

describe('CierreCajaStateService', () => {
  let service: CierreCajaStateService;
  let apiMock: any;
  let browserNavigationMock: any;

  beforeEach(() => {
    apiMock = {
      getTurno: vi.fn().mockReturnValue(of({
        fecha: '2026-06-18',
        turnoLaboralId: 1,
        nombreTurno: 'Mañana',
        resumenFinanciero: { efectivoEsperado: 1000, totalRecaudado: 5000, totalOperaciones: 10 },
        desglosePagos: [],
        rendimientoTurno: { platosMasVendidos: [], insumosMasUsados: [] }
      })),
      getHistorial: vi.fn().mockReturnValue(of([
        { id: 1, fecha: '2026-06-17', turno: 'Mañana', total: 5000, diferencia: 0, estado: 'Cuadrada' }
      ])),
      postCierre: vi.fn().mockReturnValue(of({ cierreId: 10, estado: 'Cuadrada', mensaje: 'OK' }))
    };
    browserNavigationMock = {
      abrirEnNuevaPestana: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        CierreCajaStateService,
        { provide: CierreCajaApiService, useValue: apiMock },
        { provide: BrowserNavigationService, useValue: browserNavigationMock }
      ]
    });

    service = TestBed.inject(CierreCajaStateService);
  });

  it('debería crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debería cargar turno e historial al llamar a cargarDatos', () => {
    service.cargarDatos();
    expect(apiMock.getTurno).toHaveBeenCalled();
    expect(apiMock.getHistorial).toHaveBeenCalled();
    expect(service.datosTurno()?.nombreTurno).toBe('Mañana');
    expect(service.historial()).toHaveLength(1);
    expect(service.efectivoContado()).toBe(1000);
  });

  it('no debería usar mocks si la api falla al cargarDatos', () => {
    apiMock.getTurno.mockReturnValue(throwError(() => new Error('API Error')));
    apiMock.getHistorial.mockReturnValue(throwError(() => new Error('API Error')));
    
    service.cargarDatos();
    
    expect(service.datosTurno()).toBeNull(); // No default mock
  });

  it('debería calcular diferencia', () => {
    service.cargarDatos(); // esperado: 1000, contado inicial: 1000
    service.setEfectivoContado(1200);
    expect(service.diferencia()).toBe(200);
  });

  it('debería confirmar cierre', () => {
    service.cargarDatos();
    service.setEfectivoContado(1000);
    service.setObservacion('Todo ok');
    service.abrirConfirmacion();
    
    service.confirmarCierre();
    
    expect(apiMock.postCierre).toHaveBeenCalledWith({
      restauranteId: 1,
      turnoLaboralId: 1,
      efectivoContado: 1000,
      diferencia: 0,
      sobrante: 0,
      observacion: 'Todo ok'
    });
    expect(service.cierreConfirmado()).toBe(true);
    expect(service.cierreSeleccionadoId()).toBe(10);
    expect(service.mostrarConfirmacion()).toBe(false);
  });

  it('no debería cambiar el estado si hay error al confirmar cierre', () => {
    service.cargarDatos();
    apiMock.postCierre.mockReturnValue(throwError(() => new Error('Error')));
    service.abrirConfirmacion();
    service.confirmarCierre();
    
    expect(service.cierreConfirmado()).toBe(false);
  });

  it('debería alternar modales de UI', () => {
    service.abrirDetalleCierre({ id: 1 } as any);
    expect(service.cierreDetalle()?.id).toBe(1);
    
    service.cerrarDetalleCierre();
    expect(service.cierreDetalle()).toBeNull();

    service.abrirModalPlatos('mas');
    expect(service.modalPlatosTipo()).toBe('mas');
    
    service.cerrarModalPlatos();
    expect(service.modalPlatosTipo()).toBeNull();

    service.abrirEncuestasDetalle();
    expect(service.mostrarEncuestasDetalle()).toBe(true);
    
    service.cerrarEncuestasDetalle();
    expect(service.mostrarEncuestasDetalle()).toBe(false);
  });

  it('debería abrir el reporte de cierre con navegación externa', () => {
    service.imprimirReporte(25);

    expect(browserNavigationMock.abrirEnNuevaPestana).toHaveBeenCalledWith(
      `${environment.apiUrl}/api/cierre/25/reporte-pdf`
    );
  });
});
