import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportesState } from '../../services/reportes-state';
import { ReportesPage } from './reportes-page';

describe('ReportesPage', () => {
  let fixture: ComponentFixture<ReportesPage>;
  let stateMock: {
    fechaDesde: ReturnType<typeof signal<string>>;
    fechaHasta: ReturnType<typeof signal<string>>;
    estadoDashboard: ReturnType<typeof signal<string>>;
    estadoVentas: ReturnType<typeof signal<string>>;
    estadoPersonal: ReturnType<typeof signal<string>>;
    rangoValido: boolean;
    setFechaDesde: ReturnType<typeof vi.fn>;
    setFechaHasta: ReturnType<typeof vi.fn>;
    descargarDashboard: ReturnType<typeof vi.fn>;
    descargarVentas: ReturnType<typeof vi.fn>;
    descargarPersonal: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    stateMock = {
      fechaDesde: signal(''),
      fechaHasta: signal(''),
      estadoDashboard: signal('idle'),
      estadoVentas: signal('idle'),
      estadoPersonal: signal('idle'),
      rangoValido: false,
      setFechaDesde: vi.fn((value: string) => stateMock.fechaDesde.set(value)),
      setFechaHasta: vi.fn((value: string) => stateMock.fechaHasta.set(value)),
      descargarDashboard: vi.fn(),
      descargarVentas: vi.fn(),
      descargarPersonal: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ReportesPage]
    })
      .overrideComponent(ReportesPage, {
        set: {
          providers: [{ provide: ReportesState, useValue: stateMock }]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(ReportesPage);
  });

  it('debería renderizar encabezado, rango y tres tarjetas de reporte', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.reportes-title')).nativeElement.textContent).toContain('Reportes');
    expect(fixture.debugElement.query(By.css('.range-title')).nativeElement.textContent).toContain('Rango de fechas');
    expect(fixture.debugElement.queryAll(By.css('#reporte-ejecutivo, #reporte-facturacion, #reporte-personal'))).toHaveLength(3);
    expect(fixture.debugElement.query(By.css('#reporte-ejecutivo .reporte-card-title')).nativeElement.textContent).toContain('Resumen Ejecutivo');
    expect(fixture.debugElement.query(By.css('#reporte-facturacion .reporte-card-title')).nativeElement.textContent).toContain('Reporte de Facturación');
    expect(fixture.debugElement.query(By.css('#reporte-personal .reporte-card-title')).nativeElement.textContent).toContain('Reporte de Personal');
  });

  it('debería actualizar fechas desde los inputs del template', () => {
    fixture.detectChanges();
    const desdeInput = fixture.debugElement.query(By.css('#fecha-desde'));
    const hastaInput = fixture.debugElement.query(By.css('#fecha-hasta'));

    desdeInput.triggerEventHandler('ngModelChange', '2026-07-01');
    hastaInput.triggerEventHandler('ngModelChange', '2026-07-06');

    expect(stateMock.setFechaDesde).toHaveBeenCalledWith('2026-07-01');
    expect(stateMock.setFechaHasta).toHaveBeenCalledWith('2026-07-06');
    expect(stateMock.fechaDesde()).toBe('2026-07-01');
    expect(stateMock.fechaHasta()).toBe('2026-07-06');
  });

  it('debería deshabilitar reportes con rango inválido y mostrar advertencia si ambas fechas están cargadas', () => {
    stateMock.fechaDesde.set('2026-07-07');
    stateMock.fechaHasta.set('2026-07-06');
    stateMock.rangoValido = false;

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.range-warning')).nativeElement.textContent).toContain('no es válido');
    const dashboardButton: HTMLButtonElement = fixture.debugElement.query(By.css('#reporte-ejecutivo button')).nativeElement;
    const ventasButton: HTMLButtonElement = fixture.debugElement.query(By.css('#reporte-facturacion button')).nativeElement;
    const personalButton: HTMLButtonElement = fixture.debugElement.query(By.css('#reporte-personal button')).nativeElement;
    expect(dashboardButton.disabled).toBe(true);
    expect(ventasButton.disabled).toBe(true);
    expect(personalButton.disabled).toBe(false);
  });

  it('debería llamar a las descargas cuando los botones están habilitados', () => {
    stateMock.rangoValido = true;
    fixture.detectChanges();

    fixture.debugElement.query(By.css('#reporte-ejecutivo button')).triggerEventHandler('click');
    fixture.debugElement.query(By.css('#reporte-facturacion button')).triggerEventHandler('click');
    fixture.debugElement.query(By.css('#reporte-personal button')).triggerEventHandler('click');

    expect(stateMock.descargarDashboard).toHaveBeenCalled();
    expect(stateMock.descargarVentas).toHaveBeenCalled();
    expect(stateMock.descargarPersonal).toHaveBeenCalled();
  });

  it('debería reflejar estados visuales de carga, éxito y error en los botones', () => {
    stateMock.rangoValido = true;
    stateMock.estadoDashboard.set('cargando');
    stateMock.estadoVentas.set('exito');
    stateMock.estadoPersonal.set('error');

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('#reporte-ejecutivo button')).nativeElement.textContent).toContain('Generando');
    expect(fixture.debugElement.query(By.css('#reporte-facturacion button')).nativeElement.textContent).toContain('Descargado');
    expect(fixture.debugElement.query(By.css('#reporte-personal button')).nativeElement.textContent).toContain('Error al descargar');
  });
});
