import { computed, inject, Injectable, signal, OnDestroy } from '@angular/core';
import { take } from 'rxjs';
import { 
  DashboardPeriodo, DashboardRankingItem, DashboardInsumoVencimiento, 
  DashboardLecturaComercial, DashboardAtencionItem, DashboardAccionItem, 
  DashboardDestino, DashboardVentaMensual, DashboardVentaDia,
  DashboardViewMode, PlatoAnalisis, EstadisticaMozo, WidgetLayout, FavoriteWidgetConfig,
  IngredienteExcluidoStat
} from '../../../../core/models/domain/dashboard';
import { DashboardApiService, DashboardResumenOperativoResponse } from './dashboard.api';
import { DashboardPreferencesService } from './dashboard-preferences.service';
import { SignalRConexionService } from '../../../../core/services/hubs/base-hub-service';
import { AuthService } from '../../../../core/services/auth.service';

export const DISEÑO_POR_DEFECTO: WidgetLayout[] = [
  { id: 'kpi-ventas', colSpan: 3 },
  { id: 'kpi-pedidos', colSpan: 3 },
  { id: 'kpi-ticket', colSpan: 3 },
  { id: 'kpi-promedio', colSpan: 3 },
  { id: 'ventas-calendario', colSpan: 12 },
  { id: 'platos-mas-vendidos', colSpan: 6 },
  { id: 'platos-menos-vendidos', colSpan: 6 },
  { id: 'insumos-vencer', colSpan: 12 },
  { id: 'radar-alergias', colSpan: 12 },
  { id: 'mozos', colSpan: 12 }
];

@Injectable({ providedIn: 'root' })
export class DashboardStateService implements OnDestroy {
  private api = inject(DashboardApiService);
  private preferences = inject(DashboardPreferencesService);
  private signalR = inject(SignalRConexionService);
  private auth = inject(AuthService);

  private _periodo = signal<DashboardPeriodo>('7d');
  private _fechaDesde = signal<string>('');
  private _fechaHasta = signal<string>('');

  private _modoVista = signal<DashboardViewMode>('resumen');
  private _configuracionFavoritos = signal<FavoriteWidgetConfig[]>(this.preferences.cargarFavoritos());
  estaEditando = signal<boolean>(false);
  private _platoSeleccionado = signal<PlatoAnalisis | null>(null);
  private _vencimientos = signal<DashboardInsumoVencimiento[]>([]);
  private _platosMasVendidos = signal<DashboardRankingItem[]>([]);
  private _platosMenosVendidos = signal<DashboardRankingItem[]>([]);
  private _resumen = signal<DashboardResumenOperativoResponse | null>(null);
  private _ingredientesExcluidos = signal<IngredienteExcluidoStat[]>([]);
  ingredientesExcluidos = this._ingredientesExcluidos.asReadonly();

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

  private idIntervaloPolling: any = null;
  private idTimeoutRefresco: any = null;

  constructor() {
    this.conectarHubYPolling();
  }

  private conectarHubYPolling(): void {
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

    this.idIntervaloPolling = setInterval(() => {
      this.cargarDatos();
    }, 120000);
  }

  ngOnDestroy(): void {
    if (this.idIntervaloPolling) {
      clearInterval(this.idIntervaloPolling);
    }
    if (this.idTimeoutRefresco) {
      clearTimeout(this.idTimeoutRefresco);
    }
  }

  private refrescarConDebounce(): void {
    if (this.idTimeoutRefresco) {
      clearTimeout(this.idTimeoutRefresco);
    }
    this.idTimeoutRefresco = setTimeout(() => {
      this.cargarDatos();
    }, 2000);
  }

  periodo = this._periodo.asReadonly();
  fechaDesde = this._fechaDesde.asReadonly();
  fechaHasta = this._fechaHasta.asReadonly();
  modoVista = this._modoVista.asReadonly();
  configuracionFavoritos = this._configuracionFavoritos.asReadonly();
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
      { label: 'Total', value: insumos.length, tone: 'info', key: 'todos' as const },
      { label: 'Alta', value: insumos.filter(item => item.criticidad === 'alta').length, tone: 'danger', key: 'alta' as const },
      { label: 'Media', value: insumos.filter(item => item.criticidad === 'media').length, tone: 'warning', key: 'media' as const },
      { label: 'Baja', value: insumos.filter(item => item.criticidad === 'baja').length, tone: 'neutral', key: 'baja' as const }
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

  accionPrincipal = computed<DashboardAccionItem | null>(() => {
    return [...this.acciones()].sort((a, b) => a.prioridad - b.prioridad)[0] ?? null;
  });

  esModoCalendario = computed(() => {
    if (this._periodo() === '30d') return true;
    if (this._periodo() === 'custom' && this.diasPersonalizados() > 7 && this.diasPersonalizados() <= 40) return true;
    return false;
  });

  tituloGrafico = computed(() => this.esModoCalendario() ? 'Ventas del mes' : 'Tendencia de ventas');
  subtituloGrafico = computed(() => this.esModoCalendario() ? 'Mapa de calor por día' : 'Evolución del periodo');

  ventasMensuales = computed<DashboardVentaMensual[]>(() => {
    const resumen = this._resumen();
    if (!resumen || !resumen.grafico) return [];
    return resumen.grafico.map(g => {
      let etiquetaFormateada = g.etiqueta;
      const partes = g.etiqueta.split('-');
      
      if (partes.length === 3) {
        const date = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
        const nombresDias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        etiquetaFormateada = nombresDias[date.getDay()];
      } else if (partes.length === 2) {
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
    const ventas = this.ventasCalendarioMes().map(item => item.ventas);
    return ventas.length > 0 ? Math.max(...ventas) : 0;
  });

  maxVentasMensuales = computed(() => {
    const ventas = this.ventasMensuales().map(item => item.ventas);
    return ventas.length > 0 ? Math.max(...ventas) : 0;
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

  promedioDiarioPedidosCalculado = computed(() => {
    const resumen = this._resumen();
    if (!resumen) return 0;
    const total = resumen.totalPedidos;
    const dias = this.diasDelPeriodo();
    // Return average rounded to 1 decimal place to make it high precision and functional
    const avg = total / Math.max(1, dias);
    return avg % 1 === 0 ? avg : Math.round(avg * 10) / 10;
  });

  periodoLabel = computed(() => {
    const labels: Record<DashboardPeriodo, string> = {
      '1d': 'Últimas 24 horas',
      '3d': 'Últimos 3 días',
      '7d': 'Última semana',
      '30d': 'Último mes',
      '365d': 'Último año',
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
        titulo: 'Top 5 con tracción',
        detalle: `Suma ${this.formatCurrency(totalTop)} de facturación estimada.`,
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
    return `Usar ${principales} como base para combos o destacados del día.`;
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
      if (completedCount === 4) {
        this.cargando.set(false);
        this._ultimoRefresco.set(new Date());
      }
    };

    this.api.getVencimientos().pipe(take(1)).subscribe({
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

    this.api.getRendimientoComercial(desdeIso, hastaIso).pipe(take(1)).subscribe({
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

    this.api.getResumenOperativo(desdeIso, hastaIso).pipe(take(1)).subscribe({
      next: (resumen) => {
        this._resumen.set(resumen);
        if (resumen.recordatorios) {
          this._recordatoriosAdicionales.set(resumen.recordatorios);
        } else {
          this._recordatoriosAdicionales.set([]);
        }
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando resumen operativo', err);
        checkComplete();
      }
    });

    this.api.getIngredientesExcluidos(desdeIso, hastaIso).pipe(take(1)).subscribe({
      next: (excluidos) => {
        this._ingredientesExcluidos.set(excluidos);
        checkComplete();
      },
      error: (err) => {
        console.error('Error cargando ingredientes excluidos', err);
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

  cargarConfiguracionFavoritos(): FavoriteWidgetConfig[] {
    return this.preferences.cargarFavoritos();
  }

  guardarConfiguracionFavoritos(config: FavoriteWidgetConfig[]): void {
    this.preferences.guardarFavoritos(config);
  }

  private actualizarFavoritos(config: FavoriteWidgetConfig[]): void {
    this._configuracionFavoritos.set(config);
    this.guardarConfiguracionFavoritos(config);
  }

  agregarFavorito(id: string, width?: '25' | '50' | '100'): void {
    const next = this.preferences.agregar(this._configuracionFavoritos(), id, width);
    this.actualizarFavoritos(next);
  }

  insertarFavoritoEn(id: string, index: number, width?: '25' | '50' | '100'): void {
    const next = this.preferences.insertarEn(this._configuracionFavoritos(), id, index, width);
    this.actualizarFavoritos(next);
  }

  quitarFavorito(id: string): void {
    const next = this.preferences.quitar(this._configuracionFavoritos(), id);
    this.actualizarFavoritos(next);
  }

  actualizarAnchoFavorito(id: string, width: '25' | '50' | '100'): void {
    const next = this.preferences.actualizarAncho(this._configuracionFavoritos(), id, width);
    this.actualizarFavoritos(next);
  }

  reordenarFavoritos(fromIndex: number, toIndex: number): void {
    const next = this.preferences.reordenar(this._configuracionFavoritos(), fromIndex, toIndex);
    this.actualizarFavoritos(next);
  }

  moverFavorito(fromIndex: number, toIndex: number): void {
    this.reordenarFavoritos(fromIndex, toIndex);
  }

  aplicarPreset(tipo: 'financiero' | 'operativo' | 'personal'): void {
    this.actualizarFavoritos(this.preferences.aplicarPreset(tipo));
  }

  restablecerFavoritos(): void {
    this.actualizarFavoritos(this.preferences.favoritosPorDefecto());
  }

  alternarEdicion(val?: boolean): void {
    this.estaEditando.set(val ?? !this.estaEditando());
  }

  toggleFavorito(panelId: string): void {
    const next = this.preferences.toggle(this._configuracionFavoritos(), panelId);
    this.actualizarFavoritos(next);
  }

  establecerModoVista(mode: DashboardViewMode): void {
    this._modoVista.set(mode);
    if (mode !== 'favoritos') {
      this.estaEditando.set(false);
    }
  }

  esFavorito(panelId: string): boolean {
    return this.preferences.esFavorito(this._configuracionFavoritos(), panelId);
  }

  cargandoAnalisisPlato = signal<boolean>(false);
  nombrePlatoEnAnalisis = signal<string>('');

  abrirDetallePlato(plato: DashboardRankingItem, index: number): void {
    this.cargandoAnalisisPlato.set(true);
    this.nombrePlatoEnAnalisis.set(plato.nombre);
    this._platoSeleccionado.set(null);
    this.api.getAnalisisPlato(plato.nombre).pipe(take(1)).subscribe({
      next: (detalle) => {
        this._platoSeleccionado.set(detalle);
        this.cargandoAnalisisPlato.set(false);
      },
      error: (err) => {
        console.error('Error al obtener el análisis del plato', err);
        this.mostrarToast('Error al cargar el diagnóstico de plato', 'info');
        this.cargandoAnalisisPlato.set(false);
      }
    });
  }

  aplicarDescuentoDirecto(platoNombre: string): void {
    const actual = this._platoSeleccionado();
    if (!actual) return;

    const platoId = actual.platoId || 0;

    this.api.aplicarDescuentoPlato(platoId, 10).pipe(take(1)).subscribe({
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

    this.api.agendarRecordatorioPlato(platoId, accionTitulo).pipe(take(1)).subscribe({
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
    this.cargandoAnalisisPlato.set(false);
  }

  resolverRecordatorio(id: number): void {
    this.api.resolverRecordatorio(id).pipe(take(1)).subscribe({
      next: () => {
        this._recordatoriosAdicionales.update(list => list.filter(item => item.id !== id));
        this.mostrarToast('Recordatorio resuelto con éxito', 'exito');
      },
      error: (err) => {
        console.error('Error al resolver el recordatorio', err);
        this.mostrarToast('No se pudo resolver el recordatorio en el servidor', 'info');
      }
    });
  }

  readonly mozos = computed<EstadisticaMozo[]>(() => {
    return this._resumen()?.mozos ?? [];
  });

  readonly analisisMozos = computed<string>(() => {
    const sobrecargados = this.mozos().filter(m => m.estado === 'Sobrecargado').length;
    if (sobrecargados > 0) {
      return `${sobrecargados} mozo(s) sobrecargado(s). Considera añadir refuerzos para los fines de semana.`;
    }
    return 'Distribución de mesas equilibrada.';
  });

  get favoritesConfig() {
    return this.configuracionFavoritos;
  }
  get viewMode() {
    return this.modoVista;
  }
  get isEditing() {
    return this.estaEditando;
  }
  reorderFavorites(fromIndex: number, toIndex: number): void {
    this.reordenarFavoritos(fromIndex, toIndex);
  }
  addFavorite(id: string, width?: '25' | '50' | '100'): void {
    this.agregarFavorito(id, width);
  }
  removeFavorite(id: string): void {
    this.quitarFavorito(id);
  }
  insertFavoriteAt(id: string, index: number, width?: '25' | '50' | '100'): void {
    this.insertarFavoritoEn(id, index, width);
  }
  updateFavoriteWidth(id: string, width: '25' | '50' | '100'): void {
    this.actualizarAnchoFavorito(id, width);
  }
  toggleEditing(val?: boolean): void {
    this.alternarEdicion(val);
  }
  setViewMode(mode: DashboardViewMode): void {
    this.establecerModoVista(mode);
  }
  get insightMozos() {
    return this.analisisMozos;
  }
}
