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
      historial: signal([]),
      cierreGenerado: signal(null),
      cierreDetalle: signal(null),
      turnoSeleccionado: signal(null),
      conteoCaja: signal(0),
      loading: signal(false),
      generando: signal(false),
      error: signal(null),
      turnoDiaId: signal(1),
      turnoNocheId: signal(2),

      cargarDatos: vi.fn(),
      abrirCierre: vi.fn(),
      cerrarModalCierre: vi.fn(),
      setConteoCaja: vi.fn(),
      confirmarCierre: vi.fn(),
      abrirDetalleCierre: vi.fn(),
      cerrarDetalleCierre: vi.fn()
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

  it('debería abrir el cierre del turno correspondiente', () => {
    component.abrirCierre('dia');
    expect(stateMock.abrirCierre).toHaveBeenCalledWith('dia');
  });

  it('debería cerrar el modal de cierre', () => {
    component.cerrarModalCierre();
    expect(stateMock.cerrarModalCierre).toHaveBeenCalled();
  });

  it('debería setear el conteo de caja', () => {
    component.onConteoCajaChange(2000);
    expect(stateMock.setConteoCaja).toHaveBeenCalledWith(2000);
  });

  it('debería confirmar el cierre', () => {
    component.confirmarCierre();
    expect(stateMock.confirmarCierre).toHaveBeenCalled();
  });

  it('debería delegar apertura y cierre de modal detalle', () => {
    const mockCierre: any = { fecha: '2026-01-01', turnoLaboralId: 1 };
    component.abrirDetalleCierre(mockCierre);
    expect(stateMock.abrirDetalleCierre).toHaveBeenCalledWith(mockCierre);

    component.cerrarDetalleCierre();
    expect(stateMock.cerrarDetalleCierre).toHaveBeenCalled();
  });
});
