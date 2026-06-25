import { computed, inject, Injectable, signal, OnDestroy } from '@angular/core';
import { 
  DashboardPeriodo, DashboardRankingItem, DashboardInsumoVencimiento, 
  DashboardLecturaComercial, DashboardAtencionItem, DashboardAccionItem, 
  DashboardDestino, DashboardVentaMensual, DashboardVentaDia,
  DashboardViewMode, PlatoAnalisis, PlatoSugerencia, MozoStat, WidgetLayout, FavoriteWidgetConfig
} from '../../../../core/models/domain/dashboard';
import { DashboardApiService, DashboardResumenOperativoResponse } from './dashboard.api';
import { SignalRConexionService } from '../../../../core/services/hubs/base-hub-service';
import { AuthService } from '../../../../core/services/auth.service';

export const DEFAULT_LAYOUT: WidgetLayout[] = [
  { id: 'kpi-ventas', colSpan: 3 },
  { id: 'kpi-pedidos', colSpan: 3 },
  { id: 'kpi-ticket', colSpan: 3 },
  { id: 'kpi-promedio', colSpan: 3 },
  { id: 'ventas-calendario', colSpan: 12 },
  { id: 'lectura-comercial', colSpan: 12 },
  { id: 'platos-mas-vendidos', colSpan: 6 },
  { id: 'platos-menos-vendidos', colSpan: 6 },
  { id: 'insumos-vencer', colSpan: 8 },
  { id: 'proximas-acciones', colSpan: 4 },
  { id: 'mozos', colSpan: 12 }
];

export const DEFAULT_FAVORITES: FavoriteWidgetConfig[] = [
  { id: 'kpi-ventas', width: '25' },
  { id: 'kpi-pedidos', width: '25' },
  { id: 'kpi-ticket', width: '25' },
  { id: 'kpi-promedio', width: '25' },
  { id: 'ventas-calendario', width: '100' }
];

export const PRESET_FINANCIERO: FavoriteWidgetConfig[] = [
  { id: 'kpi-ventas', width: '25' },
  { id: 'kpi-ticket', width: '25' },
  { id: 'kpi-promedio', width: '25' },
  { id: 'kpi-pedidos', width: '25' },
  { id: 'ventas-calendario', width: '100' }
];

export const PRESET_OPERATIVO: FavoriteWidgetConfig[] = [
  { id: 'insumos-vencer', width: '100' },
  { id: 'proximas-acciones', width: '50' },
  { id: 'kpi-pedidos', width: '25' },
  { id: 'kpi-promedio', width: '25' }
];

export const PRESET_PERSONAL: FavoriteWidgetConfig[] = [
  { id: 'mozos', width: '100' },
  { id: 'kpi-pedidos', width: '50' },
  { id: 'proximas-acciones', width: '50' }
];

@Injectable({ providedIn: 'root' })
export class DashboardStateService implements OnDestroy {
  private api = inject(DashboardApiService);
  private signalR = inject(SignalRConexionService);
  private auth = inject(AuthService);

  private _periodo = signal<DashboardPeriodo>('7d');
  private _fechaDesde = signal<string>('');
  private _fechaHasta = signal<string>('');

  private _viewMode = signal<DashboardViewMode>('reportes');
  private _favoritesConfig = signal<FavoriteWidgetConfig[]>(this.cargarFavoritesConfig());
  isEditing = signal<boolean>(false);
  private _platoSeleccionado = signal<PlatoAnalisis | null>(null);
  private _vencimientos = signal<DashboardInsumoVencimiento[]>([]);
  private _platosMasVendidos = signal<DashboardRankingItem[]>([]);
  private _platosMenosVendidos = signal<DashboardRankingItem[]>([]);
  private _resumen = signal<DashboardResumenOperativoResponse | null>(null);

  private _ultimoRefresco = signal<Date>(new Date());
  ultimoRefresco = this._ultimoRefresco.asReadonly();
  cargando = signal<boolean>(false);
  
  private _recordatoriosAdicionales = signal<DashboardAccionItem[]>([]);
  recordatoriosAdicionales = this._recordatoriosAdicionales.asReadonly();

  readonly toastMensaje = signal<{ texto: string; tipo: 'exito' | 'info' } | null>(null);

  mostrarToast(texto: string, tipo: 'exito' | 'info' = 'exito'): void {
    this.toastMensaje.set({ texto, tipo });
    setTimeout(() => {
      this.toastMensaje.set(null);
    }, 4000);
  }

  private pollingIntervalId: any = null;
  private refreshTimeoutId: any = null;

  constructor() {
    this.conectarHubYPolling();
  }

  private conectarHubYPolling(): void {
    // 1. Conectar SignalR
    this.signalR.iniciar().then(async () => {
      const rol = this.auth.rol();
      const restauranteId = this.auth.restauranteId;
      if (rol === 'Gerente' && restauranteId) {
        try {
          await this.signalR.hub.invoke('UnirseGerente', restauranteId);
        } catch (e) {
          console.warn('Error al unirse al grupo de Gerente en SignalR', e);
        }
      }
      this.signalR.hub.on('MesaActualizada', () => {
        this.refrescarConDebounce();
      });
    }).catch(err => {
      console.warn('SignalR falló en DashboardStateService, usando fallback de polling', err);
    });

    // 2. Fallback de Polling cada 120 segundos
    this.pollingIntervalId = setInterval(() => {
      this.cargarDatos();
    }, 120000);
  }

  ngOnDestroy(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
    }
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }
  }

  private refrescarConDebounce(): void {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
    }
    this.refreshTimeoutId = setTimeout(() => {
      this.cargarDatos();
    }, 2000);
  }

  periodo = this._periodo.asReadonly();
  fechaDesde = this._fechaDesde.asReadonly();
  fechaHasta = this._fechaHasta.asReadonly();
  viewMode = this._viewMode.asReadonly();
  favoritesConfig = this._favoritesConfig.asReadonly();
  platoSeleccionado = this._platoSeleccionado.asReadonly();


  insumosPorVencer = this._vencimientos.asReadonly();
  platosMasVendidos = this._platosMasVendidos.asReadonly();
  platosMenosVendidos = this._platosMenosVendidos.asReadonly();
  resumenOperativo = this._resumen.asReadonly();

  variacionVentasEsNegativa = computed(() => this._resumen()?.variacionVentas.startsWith('-') ?? false);
  variacionPedidosEsNegativa = computed(() => this._resumen()?.variacionPedidos.startsWith('-') ?? false);
  variacionTicketEsNegativa = computed(() => this._resumen()?.variacionTicket.startsWith('-') ?? false);

  vencimientosResumen = computed(() => {
    const insumos = this.insumosPorVencer();
    return [
      { label: 'En radar', value: insumos.length, tone: 'info' },
      { label: 'Alta', value: insumos.filter(item => item.criticidad === 'alta').length, tone: 'danger' },
      { label: 'Media', value: insumos.filter(item => item.criticidad === 'media').length, tone: 'warning' },
      { label: 'Baja', value: insumos.filter(item => item.criticidad === 'baja').length, tone: 'neutral' }
    ];
  });

  recomendacionOperativa = computed(() => {
    const criticos = this.insumosPorVencer().filter(item => item.criticidad === 'alta');
    if (criticos.length === 0) {
      return 'Sin insumos de prioridad alta. Mantener seguimiento de media y baja criticidad.';
    }
    const nombresList = criticos.map(item => item.nombre);
    let nombres = '';
    if (nombresList.length <= 4) {
      nombres = nombresList.length > 1 
        ? nombresList.slice(0, -1).join(', ') + ' y ' + nombresList.slice(-1)
        : nombresList[0];
    } else {
      nombres = nombresList.slice(0, 4).join(', ') + ` y ${nombresList.length - 4} más`;
    }
    return `Priorizar ${nombres} en preparaciones del día para reducir merma y evitar faltantes.`;
  });

  atencion = computed<DashboardAtencionItem[]>(() => {
    const criticos = this.insumosPorVencer().filter(i => i.criticidad === 'alta').length;
    const platosEnBaja = this.platosMenosVendidosPreview().length;
    const top = this.platosMasVendidosPreview();

    const items: DashboardAtencionItem[] = [];
    if (top.length > 0) {
      items.push({
        titulo: `${top[0].nombre} es tendencia`,
        detalle: 'Asegura stock de sus ingredientes',
        accion: 'Ver carta',
        destino: 'carta',
        tono: 'info'
      });
    }
    if (criticos > 0) {
      items.push({
        titulo: `<span class="attention-qty-badge">${criticos}</span> insumos críticos`,
        detalle: 'Vencen pronto',
        accion: 'Ver stock',
        destino: 'vencimientos',
        tono: 'danger'
      });
    }
    if (platosEnBaja > 0) {
      items.push({
        titulo: `<span class="attention-qty-badge">${platosEnBaja}</span> platos en baja`,
        detalle: 'Demanda ha caido',
        accion: 'Revisar carta',
        destino: 'carta',
        tono: 'warning'
      });
    }
    return items;
  });

  acciones = computed<DashboardAccionItem[]>(() => {
    const items: DashboardAccionItem[] = [];
    const criticos = this.insumosPorVencer().filter(i => i.criticidad === 'alta');
    const bajos = this.platosMenosVendidosPreview();

    if (criticos.length > 0) {
      items.push({ titulo: 'Crear pedido sugerido', detalle: 'Reponer insumos criticos', destino: 'pedido', tono: 'danger', impacto: 'Evita quiebres', prioridad: 1 });
      items.push({ titulo: 'Ver vencimientos', detalle: 'Priorizar consumo y descarte', destino: 'stock', tono: 'warning', impacto: 'Reduce merma', prioridad: 2 });
    }

    if (bajos.length > 0) {
      items.push({ titulo: 'Revisar carta', detalle: 'Ajustar baja demanda', destino: 'carta', tono: 'info', impacto: 'Recupera ventas', prioridad: 3 });
    }

    return [...items, ...this._recordatoriosAdicionales()];
  });

  esModoCalendario = computed(() => {
    if (this._periodo() === '30d') return true;
    if (this._periodo() === 'custom' && this.diasPersonalizados() > 7 && this.diasPersonalizados() <= 40) return true;
    return false;
  });

  tituloGrafico = computed(() => this.esModoCalendario() ? 'Ventas del mes' : 'Tendencia de ventas');
  subtituloGrafico = computed(() => this.esModoCalendario() ? 'Mapa de calor por dia' : 'Evolucion del periodo');

  ventasMensuales = computed<DashboardVentaMensual[]>(() => {
    const resumen = this._resumen();
    if (!resumen || !resumen.grafico) return [];
    return resumen.grafico.map(g => {
      let etiquetaFormateada = g.etiqueta;
      const partes = g.etiqueta.split('-');
      
      if (partes.length === 3) {
        // Formato yyyy-MM-dd: obtenemos el día de la semana
        const date = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
        const nombresDias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        etiquetaFormateada = nombresDias[date.getDay()];
      } else if (partes.length === 2) {
        // Formato yyyy-MM: obtenemos el nombre completo del mes
        const indexMes = parseInt(partes[1], 10) - 1;
        const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        if (indexMes >= 0 && indexMes < 12) {
          etiquetaFormateada = nombresMeses[indexMes];
        }
      }
      
      return {
        mes: etiquetaFormateada,
        ventas: this.extraerImporte(g.total)
      };
    });
  });

  ventasCalendarioMes = computed<DashboardVentaDia[]>(() => {
    const resumen = this._resumen();
    if (!resumen || !resumen.grafico || !this.esModoCalendario()) return [];

    const { desde, hasta } = this.obtenerRangoFechas();
    const ventasPorDia = new Map(resumen.grafico.map(g => [g.etiqueta, this.extraerImporte(g.total)]));
    const resultado: DashboardVentaDia[] = [];

    let actual = new Date(desde);
    while (actual <= hasta) {
      const anio = actual.getFullYear();
      const mes = String(actual.getMonth() + 1).padStart(2, '0');
      const dia = String(actual.getDate()).padStart(2, '0');
      
      const etiqueta = `${anio}-${mes}-${dia}`;
      const fechaFormatted = `${dia}/${mes}/${anio}`;
      
      resultado.push({
        dia: String(actual.getDate()),
        fecha: fechaFormatted,
        ventas: ventasPorDia.get(etiqueta) ?? 0
      });
      
      actual.setDate(actual.getDate() + 1);
    }
    
    return resultado;
  });

  maxVentasCalendarioMes = computed(() => {
    return Math.max(...this.ventasCalendarioMes().map(item => item.ventas));
  });

  maxVentasMensuales = computed(() => {
    return Math.max(...this.ventasMensuales().map(item => item.ventas));
  });

  diasDelPeriodo = computed(() => {
    switch (this._periodo()) {
      case '1d': return 1;
      case '3d': return 3;
      case '7d': return 7;
      case '30d': return 30;
      case '365d': return 365;
      case 'custom': return this.diasPersonalizados();
    }
  });

  promedioDiarioVentas = computed(() => {
    const resumen = this._resumen();
    if (!resumen) return 0;
    const total = this.extraerImporte(resumen.totalVentas);
    const dias = this.diasDelPeriodo();
    return Math.round(total / Math.max(1, dias));
  });

  lecturaCanales = computed(() => [
    { titulo: 'Mostrador en alza', detalle: '+15% comparado al mes anterior, impulsado por mediodías.' },
    { titulo: 'Delivery estable', detalle: 'Representa el mayor volumen, pero con ticket promedio más bajo.' }
  ]);

  periodoLabel = computed(() => {
    const labels: Record<DashboardPeriodo, string> = {
      '1d': 'Ultimas 24 horas',
      '3d': 'Ultimos 3 dias',
      '7d': 'Ultima semana',
      '30d': 'Ultimo mes',
      '365d': 'Ultimo año',
      custom: this._fechaDesde() && this._fechaHasta()
        ? `${this._fechaDesde()} al ${this._fechaHasta()}`
        : 'Fecha personalizada'
    };
    return labels[this._periodo()];
  });

  platosMasVendidosPreview = computed(() => this.platosMasVendidos().slice(0, 5));
  platosMenosVendidosPreview = computed(() => this.platosMenosVendidos().slice(0, 5));

  lecturaComercial = computed<DashboardLecturaComercial[]>(() => {
    const top = this.platosMasVendidosPreview();
    const bajos = this.platosMenosVendidosPreview();
    if (top.length === 0) return [];

    const lider = top[0];
    const totalTop = top.reduce((total, item) => total + this.extraerImporte(item.detalle), 0);
    const revisar = bajos.filter((_, index) => index < 2).length;

    return [
      {
        titulo: `${lider.nombre} lidera ventas`,
        detalle: `${lider.valor} unidades vendidas en el periodo.`,
        tono: 'success'
      },
      {
        titulo: 'Top 5 con traccion',
        detalle: `Suma ${this.formatCurrency(totalTop)} de facturacion estimada.`,
        tono: 'info'
      },
      {
        titulo: `${revisar} platos para revisar`,
        detalle: 'Priorizar precio, visibilidad o foto antes de pausar.',
        tono: 'warning'
      }
    ];
  });

  recomendacionTopVentas = computed(() => {
    const top = this.platosMasVendidosPreview();
    if (top.length === 0) return 'Sin datos de ventas suficientes.';
    const principales = top.slice(0, 2).map(item => item.nombre).join(' y ');
    return `Usar ${principales} como base para combos o destacados del dia.`;
  });

  accionPlatoBajo(index: number): string {
    if (index === 0) return 'Revisar precio';
    if (index === 1) return 'Mejorar visibilidad';
    return 'Relanzar';
  }

  destinoAccionPlatoBajo(index: number): DashboardDestino {
    return 'carta';
  }

  setPeriodo(periodo: DashboardPeriodo): void {
    this._periodo.set(periodo);
    if (periodo !== 'custom') {
      this._fechaDesde.set('');
      this._fechaHasta.set('');
      this.cargarDatos();
    }
  }

  setFechaDesde(fecha: string): void {
    this._fechaDesde.set(fecha);
    this._periodo.set('custom');
    if (this._fechaHasta()) this.cargarDatos();
  }

  setFechaHasta(fecha: string): void {
    this._fechaHasta.set(fecha);
    this._periodo.set('custom');
    if (this._fechaDesde()) this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando.set(true);
    let completedCount = 0;
    const checkComplete = () => {
      completedCount++;
      if (completedCount === 3) {
        this.cargando.set(false);
        this._ultimoRefresco.set(new Date());
      }
    };

    // 1. Cargar Vencimientos
    this.api.getVencimientos().subscribe({
      next: (vencimientos) => {
        this._vencimientos.set(vencimientos);
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando vencimientos', err);
        checkComplete();
      }
    });

    const { desde, hasta } = this.obtenerRangoFechas();
    const desdeIso = desde.toISOString();
    const hastaIso = hasta.toISOString();

    // 2. Cargar Rendimiento Comercial con las fechas reales del filtro
    this.api.getRendimientoComercial(desdeIso, hastaIso).subscribe({
      next: (res) => {
        this._platosMasVendidos.set(res.masVendidos);
        this._platosMenosVendidos.set(res.menosVendidos);
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando rendimiento', err);
        checkComplete();
      }
    });

    // 3. Cargar Resumen Operativo (nuevo endpoint)
    this.api.getResumenOperativo(desdeIso, hastaIso).subscribe({
      next: (resumen) => {
        this._resumen.set(resumen);
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando resumen operativo', err);
        checkComplete();
      }
    });
  }

  private obtenerRangoFechas(): { desde: Date; hasta: Date } {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let desde = new Date(hoy);
    let hasta = new Date(hoy);
    hasta.setHours(23, 59, 59, 999);

    switch (this._periodo()) {
      case '1d': break;
      case '3d': desde.setDate(desde.getDate() - 2); break;
      case '7d': desde.setDate(desde.getDate() - 6); break;
      case '30d': desde.setDate(desde.getDate() - 29); break;
      case '365d': desde.setDate(desde.getDate() - 364); break;
      case 'custom':
        const parsedDesde = this.parseFecha(this._fechaDesde());
        const parsedHasta = this.parseFecha(this._fechaHasta());
        if (parsedDesde) desde = parsedDesde;
        if (parsedHasta) {
          hasta = new Date(parsedHasta);
          hasta.setHours(23, 59, 59, 999);
        }
        break;
    }
    return { desde, hasta };
  }

  private parseFecha(fecha: string): Date | null {
    if (!fecha) return null;
    const partes = fecha.split('/');
    if (partes.length !== 3) return null;
    const [dia, mes, anio] = partes.map(Number);
    if (!dia || !mes || !anio) return null;
    return new Date(anio, mes - 1, dia);
  }

  private extraerImporte(valor: string): number {
    return Number(valor.replace(/[^0-9]/g, '')) || 0;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(value);
  }

  private factorPeriodo(): number {
    const factorPorPeriodo: Record<DashboardPeriodo, number> = {
      '1d': 0.16,
      '3d': 0.45,
      '7d': 1,
      '30d': 4.2,
      '365d': 48,
      custom: Math.max(0.14, Math.min(52, this.diasPersonalizados() / 7))
    };
    return factorPorPeriodo[this._periodo()];
  }

  private diasPersonalizados(): number {
    const desde = this.parseFecha(this._fechaDesde());
    const hasta = this.parseFecha(this._fechaHasta());
    if (!desde || !hasta) return 7;
    const diff = Math.abs(hasta.getTime() - desde.getTime());
    return Math.max(1, Math.round(diff / 86400000) + 1);
  }

  // --- REPORTES Y FAVORITOS ---
  cargarFavoritesConfig(): FavoriteWidgetConfig[] {
    try {
      const saved = localStorage.getItem('dashboard_favorites_config');
      if (saved) {
        return JSON.parse(saved) as FavoriteWidgetConfig[];
      }
    } catch (e) {}
    return [];
  }

  saveFavoritesConfig(config: FavoriteWidgetConfig[]): void {
    try {
      localStorage.setItem('dashboard_favorites_config', JSON.stringify(config));
    } catch (e) {}
  }

  addFavorite(id: string, width?: '25' | '50' | '100'): void {
    if (this.esFavorito(id)) return;
    let defaultWidth: '25' | '50' | '100' = width ?? '50';
    if (!width) {
      if (id.startsWith('kpi-')) {
        defaultWidth = '25';
      } else if (id === 'ventas-calendario' || id === 'mozos' || id === 'insumos-vencer' || id === 'lectura-comercial') {
        defaultWidth = '100';
      }
    }
    const current = [...this._favoritesConfig(), { id, width: defaultWidth }];
    this._favoritesConfig.set(current);
    this.saveFavoritesConfig(current);
  }

  insertFavoriteAt(id: string, index: number, width?: '25' | '50' | '100'): void {
    if (this.esFavorito(id)) return;
    let defaultWidth: '25' | '50' | '100' = width ?? '50';
    if (!width) {
      if (id.startsWith('kpi-')) {
        defaultWidth = '25';
      } else if (id === 'ventas-calendario' || id === 'mozos' || id === 'insumos-vencer' || id === 'lectura-comercial') {
        defaultWidth = '100';
      }
    }
    const current = [...this._favoritesConfig()];
    current.splice(index, 0, { id, width: defaultWidth });
    this._favoritesConfig.set(current);
    this.saveFavoritesConfig(current);
  }

  removeFavorite(id: string): void {
    const current = this._favoritesConfig().filter(w => w.id !== id);
    this._favoritesConfig.set(current);
    this.saveFavoritesConfig(current);
  }

  updateFavoriteWidth(id: string, width: '25' | '50' | '100'): void {
    const current = this._favoritesConfig().map(w => {
      if (w.id === id) {
        return { ...w, width };
      }
      return w;
    });
    this._favoritesConfig.set(current);
    this.saveFavoritesConfig(current);
  }

  reorderFavorites(fromIndex: number, toIndex: number): void {
    const current = [...this._favoritesConfig()];
    if (fromIndex >= 0 && fromIndex < current.length && toIndex >= 0 && toIndex < current.length) {
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      this._favoritesConfig.set(current);
      this.saveFavoritesConfig(current);
    }
  }

  moverFavorito(fromIndex: number, toIndex: number): void {
    this.reorderFavorites(fromIndex, toIndex);
  }

  aplicarPreset(tipo: 'financiero' | 'operativo' | 'personal'): void {
    let preset: FavoriteWidgetConfig[] = [];
    if (tipo === 'financiero') {
      preset = PRESET_FINANCIERO;
    } else if (tipo === 'operativo') {
      preset = PRESET_OPERATIVO;
    } else if (tipo === 'personal') {
      preset = PRESET_PERSONAL;
    }
    this._favoritesConfig.set(preset);
    this.saveFavoritesConfig(preset);
  }

  restablecerFavoritos(): void {
    this._favoritesConfig.set(DEFAULT_FAVORITES);
    this.saveFavoritesConfig(DEFAULT_FAVORITES);
  }

  toggleEditing(val?: boolean): void {
    this.isEditing.set(val ?? !this.isEditing());
  }

  toggleFavorito(panelId: string): void {
    const current = [...this._favoritesConfig()];
    const idx = current.findIndex(w => w.id === panelId);
    if (idx !== -1) {
      current.splice(idx, 1);
    } else {
      let defaultWidth: '25' | '50' | '100' = '50';
      if (panelId.startsWith('kpi-')) {
        defaultWidth = '25';
      } else if (panelId === 'ventas-calendario' || panelId === 'mozos' || panelId === 'insumos-vencer' || panelId === 'lectura-comercial') {
        defaultWidth = '100';
      }
      current.push({ id: panelId, width: defaultWidth });
    }
    this._favoritesConfig.set(current);
    this.saveFavoritesConfig(current);
  }

  setViewMode(mode: DashboardViewMode): void {
    this._viewMode.set(mode);
    if (mode !== 'favoritos') {
      this.isEditing.set(false);
    }
  }

  esFavorito(panelId: string): boolean {
    return this._favoritesConfig().some(w => w.id === panelId);
  }

  // --- DETALLE PLATO MENOS VENDIDO ---
  // --- DETALLE PLATO MENOS VENDIDO ---
  abrirDetallePlato(plato: DashboardRankingItem, index: number): void {
    this.api.getAnalisisPlato(plato.nombre).subscribe({
      next: (detalle) => {
        this._platoSeleccionado.set(detalle);
      },
      error: (err) => {
        console.error('Error al obtener el análisis del plato', err);
        this.mostrarToast('Error al cargar el diagnóstico de plato', 'info');
      }
    });
  }

  aplicarDescuentoDirecto(platoNombre: string): void {
    const actual = this._platoSeleccionado();
    if (!actual) return;

    const platoId = actual.platoId || 0;

    this.api.aplicarDescuentoPlato(platoId, 10).subscribe({
      next: (res) => {
        const precioNuevoStr = this.formatCurrency(res.precioNuevo);
        const metricasNuevas = {
          ...actual.metricas,
          precio: precioNuevoStr,
          margenPct: res.margenPctNuevo
        };

        const sugerenciasNuevas = actual.sugerenciasDetalladas.map(s => {
          if (s.tipo === 'descuento') {
            return { ...s, aplicada: true };
          }
          return s;
        });

        this._platoSeleccionado.set({
          ...actual,
          metricas: metricasNuevas,
          sugerenciasDetalladas: sugerenciasNuevas
        });

        this._platosMenosVendidos.update(list => list.map(item => {
          if (item.nombre === platoNombre) {
            return { ...item, detalle: precioNuevoStr };
          }
          return item;
        }));

        this.mostrarToast(res.mensaje || `¡Descuento del 10% aplicado exitosamente a ${platoNombre}!`);
      },
      error: (err) => {
        console.error('Error al aplicar el descuento', err);
        this.mostrarToast('No se pudo aplicar el descuento en el servidor', 'info');
      }
    });
  }

  agendarRecordatorioDirecto(platoNombre: string, accionTitulo: string): void {
    const actual = this._platoSeleccionado();
    if (!actual) return;

    const platoId = actual.platoId || 0;

    this.api.agendarRecordatorioPlato(platoId, accionTitulo).subscribe({
      next: (res) => {
        const sugerenciasNuevas = actual.sugerenciasDetalladas.map(s => {
          if (s.accion === accionTitulo) {
            return { ...s, aplicada: true };
          }
          return s;
        });

        this._platoSeleccionado.set({
          ...actual,
          sugerenciasDetalladas: sugerenciasNuevas
        });

        this._recordatoriosAdicionales.update(list => [...list, res.accionItem]);

        this.mostrarToast(res.mensaje || `¡Recordatorio agendado para la revisión de ${platoNombre}!`);
      },
      error: (err) => {
        console.error('Error al agendar el recordatorio', err);
        this.mostrarToast('No se pudo agendar el recordatorio en el servidor', 'info');
      }
    });
  }

  cerrarDetallePlato(): void {
    this._platoSeleccionado.set(null);
  }

  // --- ESTADISTICAS MOZOS (MOCK) ---
  mozos = signal<MozoStat[]>([
    { nombre: 'Juan Pérez', mesasAtendidas: 24, facturacionTotal: 85000, tiempoPromedioAtencion: '45m', estado: 'Sobrecargado' },
    { nombre: 'María Gómez', mesasAtendidas: 15, facturacionTotal: 54000, tiempoPromedioAtencion: '38m', estado: 'Optimo' },
    { nombre: 'Carlos Ruiz', mesasAtendidas: 8, facturacionTotal: 29000, tiempoPromedioAtencion: '30m', estado: 'Baja carga' }
  ]).asReadonly();

  insightMozos = computed(() => {
    const sobrecargados = this.mozos().filter(m => m.estado === 'Sobrecargado').length;
    if (sobrecargados > 0) {
      return `${sobrecargados} mozo(s) sobrecargado(s). Considera añadir refuerzos para los fines de semana.`;
    }
    return 'Distribución de mesas equilibrada.';
  });

}
