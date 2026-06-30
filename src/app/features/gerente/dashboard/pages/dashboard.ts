import { CommonModule, DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import flatpickr from 'flatpickr';
import { Instance } from 'flatpickr/dist/types/instance';
import { CustomLocale } from 'flatpickr/dist/types/locale';

import { DashboardStateService, DISEÑO_POR_DEFECTO } from '../services/dashboard.state';
import { DashboardDestino, DashboardPeriodo, WidgetLayout, FavoriteWidgetConfig, DashboardAccionItem } from '../../../../core/models/domain/dashboard';

// Import modular components
import { KpiCardComponent } from '../components/kpi-card/kpi-card';
import { VentasCalendarioComponent } from '../components/ventas-calendario/ventas-calendario';
import { LecturaComercialComponent } from '../components/lectura-comercial/lectura-comercial';
import { PlatosMasVendidosComponent } from '../components/platos-mas-vendidos/platos-mas-vendidos';
import { PlatosMenosVendidosComponent } from '../components/platos-menos-vendidos/platos-menos-vendidos';
import { InsumosVencerComponent } from '../components/insumos-vencer/insumos-vencer';
import { ProximasAccionesComponent } from '../components/proximas-acciones/proximas-acciones';
import { MozosComponent } from '../components/mozos/mozos';
import { AnalisisPlatoPanelComponent } from '../components/analisis-plato-panel/analisis-plato-panel';

export interface ModuloDisponible {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'Finanzas' | 'Ventas' | 'Inventario' | 'Personal';
  allowedWidths: ('25' | '50' | '100')[];
}

export const MODULOS_DISPONIBLES: ModuloDisponible[] = [
  { id: 'kpi-ventas', name: 'Ventas Totales', description: 'Facturación total and variación porcentual', icon: 'payments', category: 'Finanzas', allowedWidths: ['25', '50', '100'] },
  { id: 'kpi-pedidos', name: 'Pedidos Totales', description: 'Contador de órdenes y promedio por día', icon: 'shopping_bag', category: 'Ventas', allowedWidths: ['25', '50', '100'] },
  { id: 'kpi-ticket', name: 'Ticket Promedio', description: 'Gasto medio por comanda finalizada', icon: 'receipt_long', category: 'Finanzas', allowedWidths: ['25', '50', '100'] },
  { id: 'kpi-promedio', name: 'Promedio Diario', description: 'Estimado de facturación por día', icon: 'analytics', category: 'Finanzas', allowedWidths: ['25', '50', '100'] },
  { id: 'ventas-calendario', name: 'Tendencia de Ventas', description: 'Mapa de calor mensual o evolutivo', icon: 'calendar_month', category: 'Ventas', allowedWidths: ['50', '100'] },
  { id: 'lectura-0', name: 'Insight: Líder de Ventas', description: 'Detalle de platos más populares', icon: 'insights', category: 'Ventas', allowedWidths: ['25', '50', '100'] },
  { id: 'lectura-1', name: 'Insight: Tracción de Ventas', description: 'Ingresos estimados del top 5', icon: 'insights', category: 'Ventas', allowedWidths: ['25', '50', '100'] },
  { id: 'lectura-2', name: 'Insight: Platos a Revisar', description: 'Alertas de platos con baja rotación', icon: 'insights', category: 'Ventas', allowedWidths: ['25', '50', '100'] },
  { id: 'platos-mas-vendidos', name: 'Platos más vendidos', description: 'Ranking de los 5 platos favoritos', icon: 'trending_up', category: 'Ventas', allowedWidths: ['50', '100'] },
  { id: 'platos-menos-vendidos', name: 'Platos menos vendidos', description: 'Ranking de los 5 platos de menor rotación', icon: 'trending_down', category: 'Ventas', allowedWidths: ['50', '100'] },
  { id: 'insumos-vencer', name: 'Insumos por vencer', description: 'Materia prima próxima a caducar', icon: 'warning', category: 'Inventario', allowedWidths: ['50', '100'] },
  { id: 'proximas-acciones', name: 'Próximas acciones', description: 'Recomendaciones automáticas urgentes', icon: 'task_alt', category: 'Inventario', allowedWidths: ['25', '50', '100'] },
  { id: 'mozos', name: 'Desempeño de Mozos', description: 'Eficiencia y carga del personal de salón', icon: 'groups', category: 'Personal', allowedWidths: ['100'] }
];

const LOCALIZACION_ESPANOLA: CustomLocale = {
  weekdays: {
    shorthand: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
    longhand: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']
  },
  months: {
    shorthand: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    longhand: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  },
  ordinal: () => 'o',
  firstDayOfWeek: 1,
  rangeSeparator: ' a ',
  time_24hr: true
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    KpiCardComponent,
    VentasCalendarioComponent,
    LecturaComercialComponent,
    PlatosMasVendidosComponent,
    PlatosMenosVendidosComponent,
    InsumosVencerComponent,
    ProximasAccionesComponent,
    MozosComponent,
    AnalisisPlatoPanelComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {
  readonly state = inject(DashboardStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly documento = inject(DOCUMENT);
  private readonly fechaDesdeInput = viewChild<ElementRef<HTMLInputElement>>('fechaDesdeInput');
  private readonly fechaHastaInput = viewChild<ElementRef<HTMLInputElement>>('fechaHastaInput');
  private calendarioDesde: Instance | null = null;
  private calendarioHasta: Instance | null = null;
  private fragmentSub?: Subscription;

  esMovil = signal<boolean>(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  readonly menuFlotanteAbierto = signal<boolean>(false);
  readonly mostrarGloboInfo = signal<boolean>(true);
  readonly mostrarNotificaciones = signal<boolean>(false);
  readonly hoverNotificaciones = signal<boolean>(false);
  readonly tabsMovilExpandido = signal<boolean>(false);

  @HostListener('window:resize')
  alRedimensionar(): void {
    if (typeof window !== 'undefined') {
      this.esMovil.set(window.innerWidth <= 768);
    }
  }

  readonly disenoActual = computed(() => {
    return DISEÑO_POR_DEFECTO;
  });

  readonly widgetsParaVista = computed(() => {
    const modo = this.state.modoVista();
    let base = this.disenoActual().map(w => ({ ...w }));
    
    if (modo === 'personal') {
      const idxAcciones = base.findIndex(w => w.id === 'proximas-acciones');
      if (idxAcciones !== -1) {
        const [acciones] = base.splice(idxAcciones, 1);
        base.push(acciones);
      }
      base = base.map(w => {
        if (w.id === 'kpi-ticket' || w.id === 'kpi-pedidos') {
          return { ...w, colSpan: 6 };
        }
        return w;
      });
    } else if (modo === 'operativo') {
      base = base.map(w => {
        if (w.id === 'kpi-pedidos' || w.id === 'kpi-promedio') {
          return { ...w, colSpan: 6 };
        }
        return w;
      });
    }
    return base;
  });

  readonly modulosDisponibles = MODULOS_DISPONIBLES;
  readonly menuConfiguracionModuloActivo = signal<string | null>(null);
  readonly indiceArrastrado = signal<number | null>(null);
  readonly indiceArrastradoSobre = signal<number | null>(null);
  private idModuloArrastradoDesdeBarra: string | null = null;
  private indiceLienzoArrastrado: number | null = null;
  private _manijaArrastrePresionada = false;

  alIniciarArrastreDesdeBarra(event: DragEvent, widgetId: string): void {
    this.idModuloArrastradoDesdeBarra = widgetId;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('widget-id', widgetId);
      event.dataTransfer.setData('text/plain', widgetId);
    }
  }

  alSoltarEnLienzo(event: DragEvent): void {
    event.preventDefault();
    this.indiceArrastradoSobre.set(null);
    const widgetId = this.idModuloArrastradoDesdeBarra || event.dataTransfer?.getData('widget-id') || event.dataTransfer?.getData('text/plain');
    if (widgetId && widgetId !== 'undefined' && isNaN(Number(widgetId))) {
      this.state.agregarFavorito(widgetId);
      this.idModuloArrastradoDesdeBarra = null;
      setTimeout(() => {
        this.menuConfiguracionModuloActivo.set(widgetId);
      }, 100);
    }
  }

  alArrastrarSobreLienzo(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  alEntrarArrastreEnLienzo(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    if (this.indiceLienzoArrastrado !== null || this.idModuloArrastradoDesdeBarra !== null) {
      this.indiceArrastradoSobre.set(targetIndex);
    }
  }

  alSalirArrastreDeLienzo(event: DragEvent, targetIndex: number): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    const currentTarget = event.currentTarget as HTMLElement;
    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      if (this.indiceArrastradoSobre() === targetIndex) {
        this.indiceArrastradoSobre.set(null);
      }
    }
  }

  alIniciarArrastreEnLienzo(event: DragEvent, index: number): void {
    if (!this._manijaArrastrePresionada) {
      event.preventDefault();
      return;
    }

    this.indiceLienzoArrastrado = index;
    this.indiceArrastrado.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  alPresionarManijaArrastre(): void {
    this._manijaArrastrePresionada = true;
  }

  @HostListener('document:mouseup')
  alLiberarMouseEnDocumento(): void {
    this._manijaArrastrePresionada = false;
  }

  @HostListener('document:click')
  cerrarDropdowns(): void {
    this.mostrarNotificaciones.set(false);
    this.tabsMovilExpandido.set(false);
  }

  alternarNotificaciones(event: Event): void {
    event.stopPropagation();
    this.mostrarNotificaciones.update(v => !v);
  }

  toggleTabsMovil(event: Event): void {
    event.stopPropagation();
    this.tabsMovilExpandido.update(v => !v);
  }

  seleccionarTabMovil(tab: any, event: Event): void {
    event.stopPropagation();
    const doc = this.documento as any;
    if (doc.startViewTransition) {
      doc.startViewTransition(() => {
        this.state.establecerModoVista(tab);
      });
    } else {
      this.state.establecerModoVista(tab);
    }
    this.tabsMovilExpandido.set(false);
  }

  obtenerIconoVistaActiva(): string {
    const modo = this.state.modoVista();
    switch (modo) {
      case 'favoritos': return 'star';
      case 'reportes': return 'dashboard';
      case 'finanzas': return 'payments';
      case 'personal': return 'groups';
      case 'operativo': return 'settings';
      default: return 'dashboard';
    }
  }

  obtenerLabelVistaActiva(): string {
    const modo = this.state.modoVista();
    switch (modo) {
      case 'favoritos': return 'Favoritos';
      case 'reportes': return 'Todos los Reportes';
      case 'finanzas': return 'Finanzas';
      case 'personal': return 'Personal';
      case 'operativo': return 'Operativo';
      default: return 'Todos los Reportes';
    }
  }

  alSoltarEnLienzoCard(event: DragEvent, targetIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.indiceArrastradoSobre.set(null);

    const sidebarWidgetId = this.idModuloArrastradoDesdeBarra || event.dataTransfer?.getData('widget-id');
    if (sidebarWidgetId && isNaN(Number(sidebarWidgetId))) {
      this.state.insertarFavoritoEn(sidebarWidgetId, targetIndex);
      this.idModuloArrastradoDesdeBarra = null;
      setTimeout(() => {
        this.menuConfiguracionModuloActivo.set(sidebarWidgetId);
      }, 100);
      return;
    }

    const sourceIndexStr = this.indiceLienzoArrastrado !== null ? String(this.indiceLienzoArrastrado) : event.dataTransfer?.getData('text/plain');
    if (sourceIndexStr !== undefined) {
      const sourceIndex = Number(sourceIndexStr);
      if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
        const doc = this.documento as any;
        if (doc.startViewTransition) {
          doc.startViewTransition(() => {
            this.state.reordenarFavoritos(sourceIndex, targetIndex);
          });
        } else {
          this.state.reordenarFavoritos(sourceIndex, targetIndex);
        }
      }
    }
    this.indiceLienzoArrastrado = null;
    this.indiceArrastrado.set(null);
  }

  alTerminarArrastreEnLienzo(): void {
    this._manijaArrastrePresionada = false;
    this.indiceLienzoArrastrado = null;
    this.indiceArrastrado.set(null);
    this.indiceArrastradoSobre.set(null);
  }

  establecerAnchoModulo(widgetId: string, width: '25' | '50' | '100'): void {
    this.state.actualizarAnchoFavorito(widgetId, width);
    this.menuConfiguracionModuloActivo.set(null);
  }

  alternarSelectorTamano(event: Event, widgetId: string): void {
    event.stopPropagation();
    if (this.menuConfiguracionModuloActivo() === widgetId) {
      this.menuConfiguracionModuloActivo.set(null);
    } else {
      this.menuConfiguracionModuloActivo.set(widgetId);
    }
  }

  moverFavoritoArriba(index: number): void {
    if (index > 0) {
      const doc = this.documento as any;
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          this.state.moverFavorito(index, index - 1);
        });
      } else {
        this.state.moverFavorito(index, index - 1);
      }
    }
  }

  moverFavoritoAbajo(index: number): void {
    const len = this.state.configuracionFavoritos().length;
    if (index < len - 1) {
      const doc = this.documento as any;
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          this.state.moverFavorito(index, index + 1);
        });
      } else {
        this.state.moverFavorito(index, index + 1);
      }
    }
  }

  refrescarManual(): void {
    this.state.cargarDatos();
  }

  readonly periodos: { label: string; value: DashboardPeriodo }[] = [
    { label: '1 día', value: '1d' },
    { label: '3 días', value: '3d' },
    { label: '1 semana', value: '7d' },
    { label: '1 mes', value: '30d' },
    { label: '1 año', value: '365d' }
  ];

  ngOnInit(): void {
    this.state.cargarDatos();

    this.fragmentSub = this.route.fragment.subscribe(fragment => {
      if (fragment) {
        this.state.establecerModoVista('reportes');
        setTimeout(() => this.desplazarASeccion(fragment), 150);
      }
    });
  }

  ngAfterViewInit(): void {
    const baseOptions = {
      locale: LOCALIZACION_ESPANOLA,
      dateFormat: 'd/m/Y',
      allowInput: true,
      disableMobile: true,
      monthSelectorType: 'dropdown' as const,
      nextArrow: '<span class="material-symbols-outlined">keyboard_arrow_right</span>',
      prevArrow: '<span class="material-symbols-outlined">keyboard_arrow_left</span>',
      onReady: (_dates: Date[], _value: string, instance: Instance) => {
        instance.calendarContainer.classList.add('pancomido-calendar');
      }
    };

    const desde = this.fechaDesdeInput()?.nativeElement;
    const hasta = this.fechaHastaInput()?.nativeElement;

    if (desde) {
      this.calendarioDesde = flatpickr(desde, {
        ...baseOptions,
        onChange: (_dates, value) => this.establecerFechaDesde(value)
      });
    }

    if (hasta) {
      this.calendarioHasta = flatpickr(hasta, {
        ...baseOptions,
        onChange: (_dates, value) => this.establecerFechaHasta(value)
      });
    }
  }

  ngOnDestroy(): void {
    this.calendarioDesde?.destroy();
    this.calendarioHasta?.destroy();
    this.fragmentSub?.unsubscribe();
  }

  establecerPeriodo(periodo: DashboardPeriodo): void {
    this.state.setPeriodo(periodo);
    if (periodo !== 'custom') {
      this.calendarioDesde?.clear(false);
      this.calendarioHasta?.clear(false);
    }
  }

  establecerFechaDesde(fecha: string): void {
    this.state.setPeriodo('custom');
    this.state.setFechaDesde(fecha);
  }

  establecerFechaHasta(fecha: string): void {
    this.state.setPeriodo('custom');
    this.state.setFechaHasta(fecha);
  }

  deberiaMostrarModulo(widget: WidgetLayout): boolean {
    const modo = this.state.modoVista();
    if (modo === 'reportes') return true;

    if (modo === 'finanzas') {
      return widget.id === 'kpi-ventas' || 
             widget.id === 'kpi-pedidos' || 
             widget.id === 'kpi-ticket' || 
             widget.id === 'kpi-promedio' || 
             widget.id === 'ventas-calendario';
    }

    if (modo === 'operativo') {
      return widget.id === 'insumos-vencer' || 
             widget.id === 'proximas-acciones' || 
             widget.id === 'kpi-pedidos' || 
             widget.id === 'kpi-promedio';
    }

    if (modo === 'personal') {
      return widget.id === 'mozos' || 
             widget.id === 'kpi-ticket' || 
             widget.id === 'kpi-pedidos' || 
             widget.id === 'proximas-acciones';
    }

    if (widget.id === 'lectura-comercial') {
      return this.state.esFavorito('lectura-0') || 
             this.state.esFavorito('lectura-1') || 
             this.state.esFavorito('lectura-2');
    }
    return this.state.esFavorito(widget.id);
  }

  desplazarASeccion(widgetId: string): void {
    const element = this.documento.getElementById('widget-' + widgetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    this.menuFlotanteAbierto.set(false);
    this.mostrarGloboInfo.set(false);
  }

  cerrarGloboInfo(event: Event): void {
    event.stopPropagation();
    this.mostrarGloboInfo.set(false);
  }

  irA(destino: DashboardDestino, extraParams?: any): void {
    if (destino === 'vencimientos') {
      const doc = this.documento as any;
      if (doc.startViewTransition) {
        doc.startViewTransition(() => {
          this.state.establecerModoVista('reportes');
        });
      } else {
        this.state.establecerModoVista('reportes');
      }
      setTimeout(() => {
        const element = this.documento.getElementById('widget-insumos-vencer');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return;
    }

    if (destino === 'stock') {
      this.router.navigate(['/staff', 'gerente', 'stock-mercaderia'], { fragment: 'lotes' });
      return;
    }

    if (destino === 'carta') {
      this.router.navigate(['/staff', 'gerente', 'modificar-carta'], { queryParams: extraParams });
      return;
    }

    const routes: Record<DashboardDestino, string[]> = {
      stock: ['/staff', 'gerente', 'stock-mercaderia'],
      carta: ['/staff', 'gerente', 'modificar-carta'],
      proveedores: ['/staff', 'gerente', 'ver-proveedores'],
      pedido: ['/staff', 'gerente', 'realizar-pedido-sugerido'],
      vencimientos: []
    };

    this.router.navigate(routes[destino], { queryParams: extraParams });
  }

  gestionarRecordatorio(rec: DashboardAccionItem): void {
    const platoNombre = rec.titulo.replace('Revisión: ', '').trim();
    this.state.abrirDetallePlato({ nombre: platoNombre, valor: 0, detalle: '' }, 0);
  }

  desplazarAlPrincipio(): void {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
