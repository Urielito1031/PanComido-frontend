import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentasCalendarioComponent } from './ventas-calendario';
import { DashboardStateService } from '../../services/dashboard.state';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi, expect, describe, it, beforeEach } from 'vitest';

describe('VentasCalendarioComponent', () => {
  let component: VentasCalendarioComponent;
  let fixture: ComponentFixture<VentasCalendarioComponent>;
  let mockState: any;

  beforeEach(async () => {
    mockState = {
      esModoCalendario: signal(false),
      tituloGrafico: signal('Tendencia de ventas'),
      subtituloGrafico: signal('Evolucion del periodo'),
      ventasMensuales: signal([]),
      ventasCalendarioMes: signal([]),
      maxVentasMensuales: signal(100),
      maxVentasCalendarioMes: signal(100),
      esMejorDia: vi.fn().mockReturnValue(false),
      esDiaBajo: vi.fn().mockReturnValue(false),
      intensidadVentaDia: vi.fn().mockReturnValue(1),
      nivelVentaDia: vi.fn().mockReturnValue(2),
      detalleVentaDia: vi.fn().mockReturnValue(null),
      periodo: signal('30d'),
      resumenOperativo: signal({ totalVentas: '$0', totalPedidos: 0, ticketPromedio: '$0', promedioDiarioPedidos: 0 }),
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [VentasCalendarioComponent],
      providers: [
        { provide: DashboardStateService, useValue: mockState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VentasCalendarioComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render monthly chart when not in calendar mode', () => {
    mockState.esModoCalendario.set(false);
    mockState.ventasMensuales.set([
      { mes: 'Enero', ventas: 1000 },
      { mes: 'Febrero', ventas: 2000 }
    ]);
    fixture.detectChanges();

    const monthlyChart = fixture.debugElement.query(By.css('.monthly-chart'));
    expect(monthlyChart).toBeTruthy();
    
    const columns = fixture.debugElement.queryAll(By.css('.month-column'));
    expect(columns.length).toBe(2);
    expect(columns[0].nativeElement.textContent).toContain('Enero');
  });

  it('should render heatmap when in calendar mode', () => {
    mockState.esModoCalendario.set(true);
    mockState.ventasCalendarioMes.set([
      { dia: '1', fecha: '01/01/2023', ventas: 100 }
    ]);
    fixture.detectChanges();

    const heatmap = fixture.debugElement.query(By.css('.month-heatmap'));
    expect(heatmap).toBeTruthy();
    
    const days = fixture.debugElement.queryAll(By.css('.heatmap-day'));
    expect(days.length).toBe(1);
    expect(days[0].nativeElement.textContent).toContain('1');
  });

  it('should select day and open day-detail-panel in calendar mode', () => {
    mockState.esModoCalendario.set(true);
    const mockDia = { dia: '1', fecha: '01/01/2023', ventas: 100 };
    mockState.ventasCalendarioMes.set([mockDia]);
    fixture.detectChanges();

    const dayButton = fixture.debugElement.query(By.css('.heatmap-day'));
    dayButton.triggerEventHandler('click', null);
    fixture.detectChanges();

    expect(component.diaSeleccionado()).toEqual(mockDia);

    const detailPanel = fixture.debugElement.query(By.css('.day-detail-panel'));
    expect(detailPanel).toBeTruthy();
    expect(detailPanel.nativeElement.textContent).toContain('01/01/2023');
  });
});
