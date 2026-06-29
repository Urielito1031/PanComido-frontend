import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardStateService } from './dashboard.state';
import { DashboardApiService } from './dashboard.api';
import { SignalRConexionService } from '../../../../core/services/hubs/base-hub-service';
import { AuthService } from '../../../../core/services/auth.service';
import { of } from 'rxjs';
import { vi, expect, describe, it, beforeEach } from 'vitest';

describe('DashboardStateService', () => {
  let service: DashboardStateService;
  let apiSpy: any;
  let signalRSpy: any;
  let authSpy: any;

  beforeEach(() => {
    apiSpy = {
      getVencimientos: vi.fn().mockReturnValue(of([])),
      getRendimientoComercial: vi.fn().mockReturnValue(of({ masVendidos: [], menosVendidos: [] })),
      getResumenOperativo: vi.fn().mockReturnValue(of({
        totalVentas: '$ 0',
        totalPedidos: 0,
        ticketPromedio: '$ 0',
        promedioDiarioPedidos: 0,
        variacionVentas: '0%',
        variacionPedidos: '0%',
        variacionTicket: '0%',
        grafico: [],
        recordatorios: []
      })),
      getAnalisisPlato: vi.fn().mockImplementation((nombre: string) => of({
        platoId: 10,
        plato: { nombre, valor: 10, detalle: '$ 4.000' },
        diagnostico: 'Papas Fritas tiene bajas ventas.',
        sugerenciasDetalladas: [
          { tipo: 'descuento', accion: 'Aplicar descuento del 10%', impacto: 'Alto', dificultad: 'baja', esAplicable: true, aplicada: false },
          { tipo: 'combo', accion: 'Ofrecer Papas Fritas en combo', impacto: 'Medio', dificultad: 'media', esAplicable: true, aplicada: false }
        ],
        alerta: 'critica',
        metricas: {
          volumen: '10 u.',
          volumenVar: '-10%',
          costo: '$ 2.000',
          precio: '$ 4.000',
          margenPct: '50%',
          participacion: '2%'
        },
        comparativa: {
          nombre: 'Papas Rústicas',
          precio: '$ 4.500',
          ventas: '20 u.'
        },
        tendencia: [1, 2, 3, 4, 5, 6, 7]
      })),
      aplicarDescuentoPlato: vi.fn().mockImplementation((platoId: number, porcentaje: number) => of({
        mensaje: `Descuento del ${porcentaje}% aplicado exitosamente.`,
        platoId,
        precioNuevo: 3600,
        costo: 2000,
        margenPctNuevo: '44%'
      })),
      agendarRecordatorioPlato: vi.fn().mockImplementation((platoId: number, accionSugerida: string) => of({
        mensaje: 'Recordatorio agendado para la revisión.',
        accionItem: {
          titulo: 'Revisión: Papas Fritas',
          detalle: `Medir impacto de: ${accionSugerida}`,
          destino: 'carta',
          tono: 'info',
          impacto: 'Reevaluar demanda',
          prioridad: 4
        }
      }))
    };

    signalRSpy = {
      iniciar: vi.fn().mockResolvedValue(undefined),
      hub: {
        invoke: vi.fn().mockResolvedValue(undefined),
        on: vi.fn()
      }
    };

    authSpy = {
      rol: vi.fn().mockReturnValue('Gerente'),
      restauranteId: 1
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardStateService,
        { provide: DashboardApiService, useValue: apiSpy },
        { provide: SignalRConexionService, useValue: signalRSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });
    service = TestBed.inject(DashboardStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default 7d period', () => {
    expect(service.periodo()).toBe('7d');
    expect(service.periodoLabel()).toBe('Ultima semana');
  });

  describe('setPeriodo', () => {
    it('should update periodo and call cargarDatos if not custom', () => {
      apiSpy.getResumenOperativo.mockClear();
      service.setPeriodo('30d');
      expect(service.periodo()).toBe('30d');
      expect(service.periodoLabel()).toBe('Ultimo mes');
      // cargarDatos triggers API calls
      expect(apiSpy.getResumenOperativo).toHaveBeenCalled();
    });

    it('should clear dates if changing to non-custom period', () => {
      service.setFechaDesde('01/01/2023');
      service.setFechaHasta('31/01/2023');
      expect(service.periodo()).toBe('custom');
      
      service.setPeriodo('7d');
      expect(service.fechaDesde()).toBe('');
      expect(service.fechaHasta()).toBe('');
    });
  });

  describe('setFechaDesde / setFechaHasta', () => {
    it('should set custom period and only load data when both dates are present', () => {
      apiSpy.getResumenOperativo.mockClear();
      
      service.setFechaDesde('01/01/2023');
      expect(service.periodo()).toBe('custom');
      expect(apiSpy.getResumenOperativo).not.toHaveBeenCalled(); // Missing hasta
      
      service.setFechaHasta('31/01/2023');
      expect(apiSpy.getResumenOperativo).toHaveBeenCalled();
    });
  });

  describe('Computed properties from ResumenOperativo', () => {
    beforeEach(() => {
      apiSpy.getResumenOperativo.mockReturnValue(of({
        totalVentas: '$ 1,500',
        totalPedidos: 15,
        ticketPromedio: '$ 100',
        promedioDiarioPedidos: 5,
        variacionVentas: '-10%',
        variacionPedidos: '+5%',
        variacionTicket: '-2%',
        grafico: [
          { etiqueta: '2023-01', total: '$ 500' },
          { etiqueta: '2023-02', total: '$ 1000' }
        ]
      }));
      service.cargarDatos(); // Refresh with new mock data
    });

    it('should correctly identify negative variations', () => {
      expect(service.variacionVentasEsNegativa()).toBe(true);
      expect(service.variacionPedidosEsNegativa()).toBe(false);
      expect(service.variacionTicketEsNegativa()).toBe(true);
    });

    it('should calculate ventasMensuales based on grafico data', () => {
      const mensuales = service.ventasMensuales();
      expect(mensuales.length).toBe(2);
      expect(mensuales[0].mes).toBe('Enero'); // 2023-01 parses to Enero
      expect(mensuales[0].ventas).toBe(500); // Extracted number
      expect(mensuales[1].mes).toBe('Febrero');
      expect(mensuales[1].ventas).toBe(1000);
    });

    it('should calculate maxVentasMensuales', () => {
      expect(service.maxVentasMensuales()).toBe(1000);
    });
  });

  describe('esModoCalendario', () => {
    it('should be true for 30d period', () => {
      service.setPeriodo('30d');
      expect(service.esModoCalendario()).toBe(true);
    });

    it('should be false for 7d period', () => {
      service.setPeriodo('7d');
      expect(service.esModoCalendario()).toBe(false);
    });

    it('should be true for custom period between 8 and 40 days', () => {
      // Stub the method or calculate actual dates. 
      service.setFechaDesde('01/01/2023');
      service.setFechaHasta('15/01/2023');
      expect(service.esModoCalendario()).toBe(true);
    });
  });

  describe('recomendacionOperativa', () => {
    it('should suggest maintaining track if no critical issues', () => {
      apiSpy.getVencimientos.mockReturnValue(of([
        { nombre: 'Tomate', fecha: '2023-12-01', cantidad: '5', criticidad: 'baja', relativo: '' }
      ]));
      service.cargarDatos();
      expect(service.recomendacionOperativa()).toContain('Sin insumos de prioridad alta');
    });

    it('should prioritize critical items', () => {
      apiSpy.getVencimientos.mockReturnValue(of([
        { nombre: 'Tomate', fecha: '2023-12-01', cantidad: '5', criticidad: 'alta', relativo: '' },
        { nombre: 'Cebolla', fecha: '2023-12-01', cantidad: '5', criticidad: 'alta', relativo: '' }
      ]));
      service.cargarDatos();
      expect(service.recomendacionOperativa()).toContain('Priorizar Tomate y Cebolla');
    });
  });

  describe('Presets y Ordenamiento de Favoritos', () => {
    it('deberia aplicar preset financiero correctamente', () => {
      service.aplicarPreset('financiero');
      const config = service.favoritesConfig();
      expect(config.length).toBe(5);
      expect(config[0].id).toBe('kpi-ventas');
      expect(config[4].id).toBe('ventas-calendario');
    });

    it('deberia aplicar preset operativo correctamente', () => {
      service.aplicarPreset('operativo');
      const config = service.favoritesConfig();
      expect(config.length).toBe(4);
      expect(config[0].id).toBe('insumos-vencer');
      expect(config[1].id).toBe('proximas-acciones');
    });

    it('deberia aplicar preset personal correctamente', () => {
      service.aplicarPreset('personal');
      const config = service.favoritesConfig();
      expect(config.length).toBe(3);
      expect(config[0].id).toBe('mozos');
      expect(config[1].id).toBe('kpi-pedidos');
    });

    it('deberia restablecer favoritos por defecto', () => {
      service.aplicarPreset('personal');
      expect(service.favoritesConfig().length).toBe(3);
      
      service.restablecerFavoritos();
      expect(service.favoritesConfig().length).toBe(5);
      expect(service.favoritesConfig()[0].id).toBe('kpi-ventas');
    });

    it('deberia mover favoritos usando moverFavorito', () => {
      service.aplicarPreset('financiero'); // ventas (0), ticket (1)
      const originalFirst = service.favoritesConfig()[0].id;
      const originalSecond = service.favoritesConfig()[1].id;
      
      service.moverFavorito(0, 1);
      expect(service.favoritesConfig()[0].id).toBe(originalSecond);
      expect(service.favoritesConfig()[1].id).toBe(originalFirst);
    });
  });

  describe('Analisis de Plato y Acciones Directas', () => {
    let platoMock: any;

    beforeEach(() => {
      platoMock = { nombre: 'Papas Fritas', valor: 10, detalle: '$ 4.000' };
      apiSpy.getRendimientoComercial.mockReturnValue(of({
        masVendidos: [],
        menosVendidos: [platoMock]
      }));
      service.cargarDatos();
    });

    it('deberia abrir el detalle del plato y popular metricas', () => {
      service.abrirDetallePlato(platoMock, 0);
      const seleccionado = service.platoSeleccionado();
      expect(seleccionado).toBeTruthy();
      expect(seleccionado?.plato.nombre).toBe('Papas Fritas');
      expect(seleccionado?.alerta).toBe('critica');
      expect(seleccionado?.metricas.precio.replace(/\s/g, ' ')).toBe('$ 4.000');
      expect(seleccionado?.comparativa.nombre).toBe('Papas Rústicas');
      expect(seleccionado?.tendencia.length).toBe(7);
      expect(apiSpy.getAnalisisPlato).toHaveBeenCalledWith('Papas Fritas');
    });

    it('deberia aplicar descuento del 10% y actualizar el precio y estado de sugerencia', () => {
      service.abrirDetallePlato(platoMock, 0);
      service.aplicarDescuentoDirecto('Papas Fritas');
      
      const seleccionado = service.platoSeleccionado();
      expect(seleccionado?.metricas.precio.replace(/\s/g, ' ')).toBe('$ 3.600');
      expect(seleccionado?.sugerenciasDetalladas.find(s => s.tipo === 'descuento')?.aplicada).toBe(true);
      expect(service.toastMensaje()?.texto).toContain('Descuento del 10% aplicado');

      // Verificar llamadas de sincronizacion de API del Dashboard
      expect(apiSpy.aplicarDescuentoPlato).toHaveBeenCalledWith(10, 10);
      
      // El plato menos vendido debe actualizar su precio a $ 3.600
      const platosBajos = service.platosMenosVendidos();
      const papas = platosBajos.find(p => p.nombre === 'Papas Fritas');
      expect(papas?.detalle.replace(/\s/g, ' ')).toBe('$ 3.600');
    });

    it('deberia agendar recordatorio y insertarlo en la lista de acciones', () => {
      service.abrirDetallePlato(platoMock, 0);
      const sugerencia = service.platoSeleccionado()?.sugerenciasDetalladas[1];
      expect(sugerencia).toBeTruthy();
      
      service.agendarRecordatorioDirecto('Papas Fritas', sugerencia!.accion);
      
      expect(service.platoSeleccionado()?.sugerenciasDetalladas[1].aplicada).toBe(true);
      const recordatorios = service.recordatoriosAdicionales();
      expect(recordatorios.length).toBe(1);
      expect(recordatorios[0].titulo).toBe('Revisión: Papas Fritas');
      expect(service.acciones()).toContain(recordatorios[0]);
      expect(service.toastMensaje()?.texto).toContain('Recordatorio agendado');
      expect(apiSpy.agendarRecordatorioPlato).toHaveBeenCalledWith(10, sugerencia!.accion);
    });

    it('deberia cerrar el detalle del plato', () => {
      service.abrirDetallePlato(platoMock, 0);
      expect(service.platoSeleccionado()).not.toBeNull();
      service.cerrarDetallePlato();
      expect(service.platoSeleccionado()).toBeNull();
    });
  });
});
