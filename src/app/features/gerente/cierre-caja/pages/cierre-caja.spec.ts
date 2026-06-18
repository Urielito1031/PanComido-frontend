import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CierreCajaComponent } from './cierre-caja';
import { CierreCajaStateService } from '../services/cierre-caja.state';
import { vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('CierreCajaComponent', () => {
  let component: CierreCajaComponent;
  let fixture: ComponentFixture<CierreCajaComponent>;
  let stateMock: any;

  beforeEach(async () => {
    stateMock = {
      datosTurno: signal({
        nombreTurno: 'Turno Mañana',
        resumenFinanciero: { efectivoEsperado: 1000 },
        rendimientoTurno: { cantidadComensales: 50, platosMasVendidos: [], insumosMasUsados: [] }
      }),
      historial: signal([]),
      loading: signal(false),
      efectivoContado: signal(1000),
      observacion: signal(''),
      cierreConfirmado: signal(false),
      cierreSeleccionadoId: signal(null),
      turnoIdSeleccionado: signal(1),
      cierreDetalle: signal(null),
      mostrarConfirmacion: signal(false),
      modalPlatosTipo: signal(null),
      mostrarEncuestasDetalle: signal(false),
      efectivoEsperado: signal(1000),
      diferencia: signal(0),

      cargarDatos: vi.fn(),
      setEfectivoContado: vi.fn(),
      setObservacion: vi.fn(),
      cambiarTurnoId: vi.fn(),
      abrirConfirmacion: vi.fn(),
      cerrarConfirmacion: vi.fn(),
      abrirDetalleCierre: vi.fn(),
      cerrarDetalleCierre: vi.fn(),
      abrirModalPlatos: vi.fn(),
      cerrarModalPlatos: vi.fn(),
      abrirEncuestasDetalle: vi.fn(),
      cerrarEncuestasDetalle: vi.fn(),
      confirmarCierre: vi.fn(),
      imprimirReporte: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [CierreCajaComponent],
      providers: [
        { provide: CierreCajaStateService, useValue: stateMock }
      ]
    })
    .overrideComponent(CierreCajaComponent, {
      set: { schemas: [NO_ERRORS_SCHEMA] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CierreCajaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar datos al inicializar', () => {
    expect(stateMock.cargarDatos).toHaveBeenCalled();
  });

  it('debería setear el efectivo contado', () => {
    component.onEfectivoContadoChange(2000);
    expect(stateMock.setEfectivoContado).toHaveBeenCalledWith(2000);
  });

  it('debería setear la observacion', () => {
    component.onObservacionChange('Todo ok');
    expect(stateMock.setObservacion).toHaveBeenCalledWith('Todo ok');
  });

  it('debería cambiar el turno', () => {
    const eventMock = { target: { value: '2' } } as any;
    component.onTurnoChange(eventMock);
    expect(stateMock.cambiarTurnoId).toHaveBeenCalledWith(2);
  });

  it('debería delegar apertura y cierre de modal platos', () => {
    component.abrirModalPlatos('mas');
    expect(stateMock.abrirModalPlatos).toHaveBeenCalledWith('mas');
    
    component.cerrarModalPlatos();
    expect(stateMock.cerrarModalPlatos).toHaveBeenCalled();
  });

  it('debería delegar apertura y cierre de modal detalle', () => {
    const mockCierre = { id: 1 };
    component.abrirDetalleCierre(mockCierre);
    expect(stateMock.abrirDetalleCierre).toHaveBeenCalledWith(mockCierre);
    
    component.cerrarDetalleCierre();
    expect(stateMock.cerrarDetalleCierre).toHaveBeenCalled();
  });

  it('debería devolver la clase de estado correcta', () => {
    expect(component.getEstadoClase('Cuadrada')).toBe('estado-cuadrada');
    expect(component.getEstadoClase('Sobrante')).toBe('estado-sobrante');
    expect(component.getEstadoClase('Faltante')).toBe('estado-faltante');
    expect(component.getEstadoClase('')).toBe('');
  });
});
