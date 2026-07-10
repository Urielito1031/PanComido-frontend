import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardPage } from './dashboard';
import { DashboardStateService } from '../services/dashboard.state';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { vi, expect, describe, it, beforeEach } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

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
    const _viewMode = signal('resumen');
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
      aplicarPreset: vi.fn(),
      restablecerFavoritos: vi.fn(),
      moverFavorito: vi.fn(),
      atencion: signal([]),
      resumenOperativo: signal(null),
      tieneVentasRegistradas: signal(true),
      tienePedidosRegistrados: signal(true),
      tieneTicketPromedio: signal(true),
      porcentajeRailVentas: signal(62),
      esModoCalendario: signal(false),
      tituloGrafico: signal('Tendencia de ventas'),
      subtituloGrafico: signal('Evolución del periodo'),
      ventasMensuales: signal([]),
      ventasCalendarioMes: signal([]),
      platosMasVendidos: signal([]),
      platosMenosVendidos: signal([]),
      platosMasVendidosPreview: signal([]),
      platosMenosVendidosPreview: signal([]),
      ingredientesExcluidos: signal([]),
      satisfaccionComensal: signal(null),
      recomendacionTopVentas: signal(''),
      lecturaComercial: signal([]),
      vencimientosResumen: signal([]),
      recomendacionOperativa: signal(''),
      acciones: signal([]),
      accionPrincipal: signal(null),
      promedioDiarioVentas: signal(0),
      maxVentasMensuales: signal(100),
      maxVentasCalendarioMes: signal(100),
      periodoLabel: signal('Última semana'),
      variacionVentasEsNegativa: signal(false),
      variacionPedidosEsNegativa: signal(false),
      variacionTicketEsNegativa: signal(false),
      ultimoRefresco: signal(new Date()),
      cargando: signal(false),
      insumosPorVencer: signal([]),
      lecturaCanales: signal([]),
      platoSeleccionado: signal(null),
      cargandoAnalisisPlato: signal(false),
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
      establecerModoVista: vi.fn(),
      abrirDetallePlato: vi.fn(),
      cerrarDetallePlato: vi.fn(),
      aplicarDescuentoDirecto: vi.fn(),
      agendarRecordatorioDirecto: vi.fn(),
      resolverRecordatorio: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: DashboardStateService, useValue: mockState },
        { provide: Router, useValue: { navigate: vi.fn(), url: '/' } },
        { provide: ActivatedRoute, useValue: { fragment: of(null), queryParams: of({}) } }
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

  it('should render header description and period label in toolbar', () => {
    mockState.periodoLabel.set('Última semana');
    fixture.detectChanges();
    
    const subtitle = fixture.debugElement.query(By.css('.subtitle')).nativeElement;
    expect(subtitle.textContent).toContain('Priorizá decisiones');

    const periodContext = fixture.debugElement.query(By.css('.period-context')).nativeElement;
    expect(periodContext.textContent).toContain('Última semana');
  });

  it('should render KPI report strip if resumenOperativo is present', () => {
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
    
    const heroValue = fixture.debugElement.query(By.css('.kpi-hero-value'));
    expect(heroValue.nativeElement.textContent).toContain('$ 5,000');

    const miniCards = fixture.debugElement.queryAll(By.css('.kpi-mini-card'));
    expect(miniCards.length).toBe(3);
  });

  it('should set period and update state when clicking period buttons', () => {
    fixture.detectChanges();
    
    const buttons = fixture.debugElement.queryAll(By.css('.period-button:not(.custom-period)'));
    // Click '1 mes' which is the 4th button (index 3)
    buttons[3].triggerEventHandler('click', null);
    
    expect(mockState.setPeriodo).toHaveBeenCalledWith('30d');
  });

  it('should set period to custom when modifying date inputs', () => {
    fixture.detectChanges();
    component.establecerFechaDesde('2026-06-01');
    expect(mockState.setPeriodo).toHaveBeenCalledWith('custom');
  });
});
