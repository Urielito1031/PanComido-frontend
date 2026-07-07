import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardNavigationService } from '../../services/dashboard-navigation.service';
import { DashboardStateService } from '../../services/dashboard.state';
import { AnalisisPlatoPanelComponent } from './analisis-plato-panel';

describe('AnalisisPlatoPanelComponent', () => {
  let fixture: ComponentFixture<AnalisisPlatoPanelComponent>;
  let stateMock: any;
  let navigationMock: any;

  beforeEach(async () => {
    stateMock = {
      cargandoAnalisisPlato: signal(false),
      nombrePlatoEnAnalisis: signal('Sopa'),
      platoSeleccionado: signal(null),
      cerrarDetallePlato: vi.fn(),
      aplicarDescuentoDirecto: vi.fn(),
      agendarRecordatorioDirecto: vi.fn()
    };
    navigationMock = { irA: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [AnalisisPlatoPanelComponent],
      providers: [
        { provide: DashboardStateService, useValue: stateMock },
        { provide: DashboardNavigationService, useValue: navigationMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalisisPlatoPanelComponent);
  });

  it('debería mostrar skeleton cuando está cargando análisis', () => {
    stateMock.cargandoAnalisisPlato.set(true);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.skeleton-diagnostico-box'))).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Generando diagnóstico');
  });

  it('debería renderizar detalle, confirmar descuento y agendar recordatorio', () => {
    stateMock.platoSeleccionado.set({
      alerta: 'critica',
      plato: { nombre: 'Sopa', valor: 1 },
      diagnostico: 'Demanda baja.',
      metricas: { volumen: '1 u.', volumenVar: '-80%', participacion: '1%', precio: '$ 1000', costo: '$ 600', margenPct: '40%' },
      tendencia: [8, 6, 4, 2, 1],
      comparativa: { nombre: 'Pizza', ventas: '20 u.', precio: '$ 2000' },
      sugerenciasDetalladas: [
        { impacto: 'Alto', dificultad: 'baja', aplicada: false, tipo: 'descuento', accion: 'Aplicar descuento' },
        { impacto: 'Medio', dificultad: 'media', aplicada: false, tipo: 'recordatorio', accion: 'Revisar receta' }
      ]
    });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.criticidad-badge')).nativeElement.classList).toContain('critica');
    fixture.debugElement.query(By.css('.sug-btn.primary')).triggerEventHandler('click');
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.confirm-yes')).triggerEventHandler('click');
    fixture.debugElement.query(By.css('.sug-btn.secondary')).triggerEventHandler('click');

    expect(stateMock.aplicarDescuentoDirecto).toHaveBeenCalledWith('Sopa');
    expect(stateMock.agendarRecordatorioDirecto).toHaveBeenCalledWith('Sopa', 'Revisar receta');
  });

  it('debería calcular sparkline, navegar y cerrar detalle', () => {
    const component = fixture.componentInstance;

    expect(component.obtenerPuntosSparkline([])).toBe('');
    expect(component.obtenerArrayPuntosSparkline([1, 2, 3])).toHaveLength(3);
    expect(component.obtenerPuntosSparkline([1, 2, 3])).toContain('6,54');

    component.confirmandoDescuento.set(true);
    component.cerrarDetallePlato();
    component.irA('carta', { buscar: 'Sopa' });

    expect(component.confirmandoDescuento()).toBe(false);
    expect(stateMock.cerrarDetallePlato).toHaveBeenCalled();
    expect(navigationMock.irA).toHaveBeenCalledWith('carta', { buscar: 'Sopa' });
  });
});
