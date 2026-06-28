import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, DatePipe, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { PlatoSugerido } from '../../../../core/models/domain/sugerencia-ia';
// Componentes UI
import { PageToolbar } from '../../../../shared/ui/page-toolbar/page-toolbar';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { Buscador } from '../../../../shared/ui/buscador/buscador';

// Modelos y Estados
import { Aviso } from '../../../../core/models/domain/aviso';
import { VencimientosState } from '../../aviso-vencimientos/services/vencimientos.state';
import { AvisosStateService } from '../services/avisos.state';
import { UnidadMedida } from '../../../../core/models/domain/unidad-medida';
import { RealizarPedidoSugeridoStateService } from '../../realizar-pedido-sugerido/services/realizar-pedido-sugerido.state';
import { ArsCurrencyPipe } from '../../../../shared/pipes/ars-currency.pipe';

@Component({
  selector: 'app-avisos',
  standalone: true,
  imports: [CommonModule, DatePipe, PageToolbar, Boton, Buscador, ArsCurrencyPipe],
  templateUrl: './avisos.html',
  styleUrls: ['./avisos.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvisosPage implements OnInit {

  protected readonly state = inject(AvisosStateService);
  protected readonly pedidoState = inject(VencimientosState);
  protected readonly pedidoSugeridoState = inject(RealizarPedidoSugeridoStateService);
  protected readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);

  protected readonly isPedidoOffcanvasOpen = signal(false);
  protected readonly cantidadAgregar = signal(1);
  protected readonly stockAvisoSeleccionado = signal<Aviso | null>(null);
  protected readonly vencimientoSeleccionado = signal<Aviso | null>(null);
  panelPreviewAbierto = signal<'sistema' | 'ia' | null>(null);

  isStockExpanded = signal(true);
  isVencimientosExpanded = signal(true);

  paginaStock = signal(1);
  paginaVencimientos = signal(1);

  totalPaginasStock = computed(() => {
    return Math.max(1, Math.ceil(this.state.stockBajo().length / 6));
  });

  insumosStockPaginados = computed(() => {
    const inicio = (this.paginaStock() - 1) * 6;
    return this.state.stockBajo().slice(inicio, inicio + 6);
  });

  totalPaginasVencimientos = computed(() => {
    return Math.max(1, Math.ceil(this.state.vencimientos().length / 6));
  });

  vencimientosPaginados = computed(() => {
    const inicio = (this.paginaVencimientos() - 1) * 6;
    return this.state.vencimientos().slice(inicio, inicio + 6);
  });

  constructor() {
    effect(() => {
      const totalStock = this.totalPaginasStock();
      if (this.paginaStock() > totalStock) {
        this.paginaStock.set(1);
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const totalVenc = this.totalPaginasVencimientos();
      if (this.paginaVencimientos() > totalVenc) {
        this.paginaVencimientos.set(1);
      }
    }, { allowSignalWrites: true });
  }

  cambiarPaginaStock(delta: number, event: Event) {
    event.stopPropagation();
    const nuevaPagina = this.paginaStock() + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginasStock()) {
      this.paginaStock.set(nuevaPagina);
    }
  }

  cambiarPaginaVencimientos(delta: number, event: Event) {
    event.stopPropagation();
    const nuevaPagina = this.paginaVencimientos() + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginasVencimientos()) {
      this.paginaVencimientos.set(nuevaPagina);
    }
  }

  desplazarASeccion(id: string) {
    if (id === 'seccion-stock') {
      this.isStockExpanded.set(true);
    } else if (id === 'seccion-vencimientos') {
      this.isVencimientosExpanded.set(true);
    }
    setTimeout(() => {
      const element = this.documento.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  }

  desplazarAlPrincipio() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleStock() {
    this.isStockExpanded.update(v => !v);
  }

  toggleVencimientos() {
    this.isVencimientosExpanded.update(v => !v);
  }

  abrirPreviewSugerencia(tipo: 'sistema' | 'ia') {
    if (this.panelPreviewAbierto() === tipo) {
      this.panelPreviewAbierto.set(null);
      return;
    }
    this.panelPreviewAbierto.set(tipo);

    if (tipo === 'sistema') {
      this.pedidoSugeridoState.cargarDatos();
    }

    if (tipo === 'ia') {
      this.state.generarSugerenciasIA();
    }
  }

  irASugerenciasSistemaFull() {
    this.router.navigate(['/staff/gerente/realizar-pedido-sugerido']);
  }

  ngOnInit(): void {
    this.state.cargarAvisos();
    this.state.cargarSugerenciasCocina();
  }

  onBuscar(term: string) {
    this.state.setSearchTerm(term);
  }

  abrirAviso(aviso: Aviso) {
    if (aviso.tipo === 'vencimiento') {
      this.vencimientoSeleccionado.set(aviso);
    } else {
      this.abrirVencimientos(aviso.id);
    }
  }

  cerrarModalVencimiento() {
    this.vencimientoSeleccionado.set(null);
  }

  abrirVencimientos(avisoId: string) {
    this.router.navigate(['/staff/gerente/aviso-vencimientos'], { queryParams: { avisoId } });
  }

  abrirPedidoStock(aviso: Aviso) {
    this.stockAvisoSeleccionado.set(aviso);
    this.cantidadAgregar.set(1);


    this.pedidoState.seleccionarIngredienteParaPedido({
      id: Number(aviso.id),
      nombre: aviso.titulo,
      fechaVencimiento: '',
      stockDisponible: this.getStockDisponible(aviso),
      unidadMedida: this.getUnidadMedida(aviso)
    });

    this.isPedidoOffcanvasOpen.set(true);
  }

  cerrarPedidoStock() {
    this.isPedidoOffcanvasOpen.set(false);
    this.stockAvisoSeleccionado.set(null);
    this.pedidoState.limpiarSeleccion();
  }

  seleccionarProveedor(e: Event) {
    const proveedorId = (e.target as HTMLSelectElement).value;
    const proveedor = this.pedidoState.proveedoresDisponibles().find(item => item.id.toString() === proveedorId);
    if (proveedor) {
      this.pedidoState.seleccionarProveedor(proveedor);
    }
  }

  updateCantidad(e: Event) {
    this.cantidadAgregar.set(Number((e.target as HTMLInputElement).value));
  }

  confirmarPedidoStock() {
    const pedido = this.pedidoState.crearPedidoPendiente(this.cantidadAgregar());
    const aviso = this.stockAvisoSeleccionado();

    if (!pedido || !aviso) return;

    pedido.pipe(take(1)).subscribe({
      next: (proveedor) => {
        this.state.marcarRevisado(aviso.tipo, aviso.id);
        this.cerrarPedidoStock();
        this.router.navigate(['/staff', 'gerente', 'ver-proveedores', proveedor.id, 'historial']);
      },
      error: (err) => console.error('Error al confirmar pedido de stock:', err)
    });
  }

  cerrarConfirmacionCarta(): void {
    this.state.cerrarConfirmacionCarta();
  }

  irAModificarCarta(): void {
    this.state.cerrarConfirmacionCarta();
    this.router.navigate(['/staff', 'gerente', 'modificar-carta']);
  }

  // Usa el stock real del backend a través del payload
  private getStockDisponible(aviso: Aviso): number {
    if (aviso.payloadStock) {
      return aviso.payloadStock.stockActual;
    }
    return 0;
  }

  // Devuelve la unidad desde el payload
  private getUnidadMedida(aviso: Aviso): UnidadMedida {
    const defaultUnidad: UnidadMedida = { id: 1, nombre: 'Kg' };

    if (aviso.payloadStock) {
      const u = aviso.payloadStock.unidadMedida.toUpperCase();
      if (u === 'L' || u === 'LT') return { id: 3, nombre: 'Lt' };
      if (u === 'UN' || u === 'UNIDAD') return { id: 5, nombre: 'Unidad' };
      if (u === 'GR') return { id: 2, nombre: 'Gr' };
      return { id: 1, nombre: aviso.payloadStock.unidadMedida };
    }

    return defaultUnidad;
  }

  nombreUnidad(unidadMedida: UnidadMedida | string | null | undefined): string {
    if (!unidadMedida) return '';
    return typeof unidadMedida === 'string' ? unidadMedida : unidadMedida.nombre;
  }

  // ← PEGÁ ACÁ ↓
  crearPlatoDesdeIA(plato: PlatoSugerido) {
    this.router.navigate(['/staff/gerente/crear-plato'], {
      state: {
        desde_ia: true,
        nombre: plato.nombre,
        descripcion: plato.descripcion,
        tiempoPreparacion: plato.tiempoPreparacion,
        ingredientes: plato.ingredientesSugeridos.map(ing => ({
          insumoId: ing.insumoId,
          nombre: ing.nombre,
          cantidad: ing.cantidad,
          opcional: false
        }))
      }
    });
  }


}
