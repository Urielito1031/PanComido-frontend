import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardPage } from './dashboard';
import { DashboardStateService } from '../services/dashboard.state';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi, expect, describe, it, beforeEach, afterEach } from 'vitest';

vi.mock('flatpickr', () => {
  return {
    default: vi.fn().mockReturnValue({
      open: vi.fn(),
      clear: vi.fn(),
      destroy: vi.fn()
    })
  };
});

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let mockState: any;

  beforeEach(async () => {
    const _viewMode = signal('reportes');
    const _favoritesConfig = signal([]);
    const _isEditing = signal(false);
    const _insightMozos = signal('');
    // Create a mock state service with signals
    mockState = {
      periodo: signal('7d'),
      fechaDesde: signal(''),
      fechaHasta: signal(''),
      viewMode: _viewMode,
      modoVista: _viewMode,
      favoritesConfig: _favoritesConfig,
      configuracionFavoritos: _favoritesConfig,
      isEditing: _isEditing,
      estaEditando: _isEditing,
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn(),
      addFavorite: vi.fn(),
      agregarFavorito: vi.fn(),
      insertFavoriteAt: vi.fn(),
      insertarFavoritoEn: vi.fn(),
      removeFavorite: vi.fn(),
      quitarFavorito: vi.fn(),
      updateFavoriteWidth: vi.fn(),
      actualizarAnchoFavorito: vi.fn(),
      reorderFavorites: vi.fn(),
      reordenarFavoritos: vi.fn(),
      toggleEditing: vi.fn(),
      alternarEdicion: vi.fn(),
      atencion: signal([]),
      resumenOperativo: signal(null),
      esModoCalendario: signal(false),
      tituloGrafico: signal('Tendencia de ventas'),
      subtituloGrafico: signal('Evolucion del periodo'),
      ventasMensuales: signal([]),
      ventasCalendarioMes: signal([]),
      platosMasVendidos: signal([]),
      platosMenosVendidos: signal([]),
      platosMasVendidosPreview: signal([]),
      platosMenosVendidosPreview: signal([]),
      recomendacionTopVentas: signal(''),
      lecturaComercial: signal([]),
      vencimientosResumen: signal([]),
      recomendacionOperativa: signal(''),
      acciones: signal([]),
      promedioDiarioVentas: signal(0),
      maxVentasMensuales: signal(100),
      maxVentasCalendarioMes: signal(100),
      periodoLabel: signal('Ultima semana'),
      variacionVentasEsNegativa: signal(false),
      variacionPedidosEsNegativa: signal(false),
      variacionTicketEsNegativa: signal(false),
      ultimoRefresco: signal(new Date()),
      cargando: signal(false),
      insumosPorVencer: signal([]),
      lecturaCanales: signal([]),
      platoSeleccionado: signal(null),
      mozos: signal([]),
      insightMozos: _insightMozos,
      analisisMozos: _insightMozos,
      recordatoriosAdicionales: signal([]),
      toastMensaje: signal(null),
      cargarDatos: vi.fn(),
      setPeriodo: vi.fn(),
      setFechaDesde: vi.fn(),
      setFechaHasta: vi.fn(),
      setViewMode: vi.fn(),
      abrirDetallePlato: vi.fn(),
      cerrarDetallePlato: vi.fn(),
      aplicarDescuentoDirecto: vi.fn(),
      agendarRecordatorioDirecto: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: DashboardStateService, useValue: mockState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
  });

  it('should create the component and call cargarDatos on init', () => {
    fixture.detectChanges(); // Triggers ngOnInit
    expect(component).toBeTruthy();
    expect(mockState.cargarDatos).toHaveBeenCalled();
  });

  it('should render header and period label', () => {
    mockState.periodoLabel.set('Ultima semana');
    fixture.detectChanges();
    
    const subtitle = fixture.debugElement.query(By.css('.subtitle')).nativeElement;
    expect(subtitle.textContent).toContain('Ultima semana');
  });

  it('should render KPI grid if resumenOperativo is present', () => {
    mockState.resumenOperativo.set({
      totalVentas: '$ 5,000',
      totalPedidos: 20,
      ticketPromedio: '$ 250',
      promedioDiarioPedidos: 5,
      variacionVentas: '+10%',
      variacionPedidos: '+5%',
      variacionTicket: '+2%'
    });
    fixture.detectChanges();

    const gridContainer = fixture.debugElement.query(By.css('.dashboard-grid-container'));
    expect(gridContainer).toBeTruthy();
    
    const values = fixture.debugElement.queryAll(By.css('.kpi-value'));
    expect(values.length).toBeGreaterThan(0);
    expect(values[0].nativeElement.textContent).toContain('$ 5,000');
  });

  it('should set period and update state when clicking period buttons', () => {
    fixture.detectChanges();
    
    const buttons = fixture.debugElement.queryAll(By.css('.period-button:not(.custom-period)'));
    // Click '1 mes' which is the 4th button (index 3)
    buttons[3].triggerEventHandler('click', null);
    
    expect(mockState.setPeriodo).toHaveBeenCalledWith('30d');
  });

  it('should open custom filter when clicking Personalizado', async () => {
    vi.useFakeTimers();
    fixture.detectChanges();
    
    const customBtn = fixture.debugElement.query(By.css('.custom-period'));
    customBtn.triggerEventHandler('click', null);
    
    vi.runAllTimers();
    expect(mockState.setPeriodo).toHaveBeenCalledWith('custom');
    vi.useRealTimers();
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
