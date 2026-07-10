import { ChangeDetectionStrategy, Component, computed, inject, signal, effect, OnInit, viewChild } from '@angular/core';
import { InsumoList } from '../../components/stock-list/insumo-list';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PageToolbar } from "../../../../../shared/ui/page-toolbar/page-toolbar";
import { Buscador } from "../../../../../shared/ui/buscador/buscador";
import { Modal } from "../../../../../shared/ui/modal/modal";
import { StockMercaderiaState } from '../../services/insumos/stock-mercaderia-state';
import { BodegaState } from '../../services/bodegas/bodega-state';
import { StockTourService } from '../../services/stock-tour.service';
import { ProductoForm, GuardarProductoPayload } from "../../components/producto-form/producto-form";
import { Insumo, LoteInsumo } from '../../../../../core/models/domain/insumo';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { EditarBebidaFormComponent, GuardarBebidaPayload } from '../../components/editar-bebida-form/editar-bebida-form';
import { ModalEliminarInsumoComponent } from '../../components/modal-eliminar-insumo/modal-eliminar-insumo';
import { BodegaForm, GuardarBodegaPayload } from '../../components/bodega-form/bodega-form';
import { ModalEliminarBodegaComponent } from '../../components/modal-eliminar-bodega/modal-eliminar-bodega';
import { LoteForm } from '../../components/lote-form/lote-form';
import { ModalEliminarLoteComponent } from '../../components/modal-eliminar-lote/modal-eliminar-lote';
import { LoteRequest } from '../../../../../core/models/dtos/requests/lote.request';

type EstadoStockFiltro = 'todos' | 'criticos' | 'bajos' | 'ok';

@Component({
  selector: 'app-insumo',
  standalone: true,
  imports: [InsumoList, CommonModule, PageToolbar, Buscador, Modal, ProductoForm, EditarBebidaFormComponent, ModalEliminarInsumoComponent, BodegaForm, ModalEliminarBodegaComponent, LoteForm, ModalEliminarLoteComponent],
  templateUrl: './insumo-page.html',
  styleUrl: './insumo-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsumoPage implements OnInit {

  protected state = inject(StockMercaderiaState);
  protected bodegaState = inject(BodegaState);
  private route = inject(ActivatedRoute);
  private readonly tour = inject(StockTourService);

  pagina = signal<number>(1);
  itemsPorPagina = 9;

  totalPaginas = computed(() => {
    if (this.tabSeleccionada() === 'bodegas') return 1;
    const totalItems = this.tabSeleccionada() === 'lotes'
      ? this.lotesVista().length
      : this.productosFiltrados().length;
    return Math.max(1, Math.ceil(totalItems / this.itemsPorPagina));
  });

  productosPaginados = computed(() => {
    const inicio = (this.pagina() - 1) * this.itemsPorPagina;
    return this.productosFiltrados().slice(inicio, inicio + this.itemsPorPagina);
  });

  lotesPaginados = computed(() => {
    const inicio = (this.pagina() - 1) * this.itemsPorPagina;
    return this.lotesVista().slice(inicio, inicio + this.itemsPorPagina);
  });

  modalBodega = viewChild<Modal>('modalBodega');

  constructor() {
    effect(() => {
      // Registrar dependencias de filtros y pestañas para resetear página
      this.termino();
      this.categoria();
      this.tipoBodegaFiltro();
      this.estadoFiltro();
      this.tabSeleccionada();

      this.pagina.set(1);
    }, { allowSignalWrites: true });

    effect(() => {
      const estado = this.bodegaState.estadoGuardar();
      if (estado === 'success') {
        this.modalBodega()?.cerrar();
        this.limpiarEstadoModalBodega();
        this.bodegaState.resetEstados();
      }
    });

    effect(() => {
      const estado = this.bodegaState.estadoEliminar();
      if (estado === 'success') {
        this.bodegaEliminandoId.set(null);
        this.bodegaState.resetEstados();
      }
    }, { allowSignalWrites: true });
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.pagina() + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.pagina.set(nuevaPagina);
    }
  }

  termino = signal<string>('');
  categoria = signal<string[]>([]);
  tipoBodegaFiltro = signal<string[]>([]);
  estadoFiltro = signal<EstadoStockFiltro>('todos');

  tabSeleccionada = signal<'productos' | 'bodegas' | 'lotes'>('productos');
  productoEditandoId = signal<number | null>(null);
  productoEliminandoId = signal<number | null>(null);
  bodegaEditandoId = signal<number | null>(null);
  bodegaEliminandoId = signal<number | null>(null);
  loteEditandoId = signal<number | null>(null);
  loteEliminandoId = signal<number | null>(null);

  bodegaSeleccionada = computed(() => {
    const id = this.bodegaEditandoId();
    if (!id) return null;
    return this.bodegaState.bodegas().find(b => b.id === id) || null;
  });

  bodegaAEliminar = computed(() => {
    const id = this.bodegaEliminandoId();
    if (!id) return null;
    return this.bodegaState.bodegas().find(b => b.id === id) || null;
  });

  loteSeleccionado = computed(() => {
    const id = this.loteEditandoId();
    if (!id) return null;
    return this.state.lotes().find(l => l.id === id) || null;
  });

  loteAEliminar = computed(() => {
    const id = this.loteEliminandoId();
    if (!id) return null;
    return this.state.lotes().find(l => l.id === id) || null;
  });

  nombreInsumoLoteAEliminar = computed(() => {
    const lote = this.loteAEliminar();
    if (!lote) return '';
    return this.state.productos().find(p => p.id === lote.insumoId)?.nombre || '';
  });

  tituloModal = computed(() => {
    return this.productoEditandoId() ? 'Editar Insumo' : 'Nuevo Insumo'
  })
  modalAbierto = signal<boolean>(false);

  insumoAEliminar = computed(() => {
    const id = this.productoEliminandoId();
    if (!id) return null;
    return this.state.productos().find(p => p.id === id) || null;
  });

  categoriasConInfo = computed(() => {
    const productos = this.state.productos();
    return this.state.categoriasInsumos().map(cat => {
      const insumosCat = productos.filter(
        p => p.categoriaIngrediente?.descripcion === cat.descripcion
      );
      const tieneCritico = insumosCat.some(p => p.stockActual < p.stockMinimo);
      const tieneBajo = insumosCat.some(
        p => p.stockActual >= p.stockMinimo && p.stockActual < p.stockMinimo * 2
      );
      const alerta: 'critico' | 'bajo' | 'ok' =
        tieneCritico ? 'critico' : tieneBajo ? 'bajo' : 'ok';
      return { nombre: cat.descripcion, total: insumosCat.length, alerta };
    });
  });

  tiposBodegaConInfo = computed(() => {
    const bodegas = this.bodegaState.bodegas();
    const nombres = Array.from(new Set(bodegas.map(b => b.tipoBodega).filter(Boolean)));
    return nombres.map(nombre => ({
      nombre,
      total: bodegas.filter(b => b.tipoBodega === nombre).length,
    }));
  });

  bodegasFiltradasPorTipo = computed(() => {
    const tipos = this.tipoBodegaFiltro();
    const bodegas = this.bodegaState.bodegas();
    if (tipos.length === 0) return bodegas;
    return bodegas.filter(b => tipos.includes(b.tipoBodega));
  });

  totalProductos = computed(() => this.state.productos().length);

  productosCriticos = computed(() =>
    this.state.productos().filter(p => p.stockActual < p.stockMinimo).length
  );

  productosBajos = computed(() =>
    this.state.productos().filter(p => p.stockActual >= p.stockMinimo && p.stockActual < p.stockMinimo * 2).length
  );

  productosOk = computed(() =>
    this.state.productos().filter(p => p.stockActual >= p.stockMinimo * 2).length
  );

  filtrosActivos = computed(() => {
    let total = 0;
    if (this.termino().trim()) total++;
    if (this.categoria().length > 0) total++;
    if (this.estadoFiltro() !== 'todos') total++;
    if (this.tabSeleccionada() === 'bodegas' && this.tipoBodegaFiltro().length > 0) total++;
    return total;
  });

  contextoListado = computed(() => {
    if (this.tabSeleccionada() === 'bodegas') return 'Bodegas';
    if (this.tabSeleccionada() === 'lotes') return 'Lotes';
    if (this.estadoFiltro() === 'criticos') return 'Productos críticos';
    if (this.estadoFiltro() === 'bajos') return 'Productos bajos';
    if (this.estadoFiltro() === 'ok') return 'Productos ok';
    return 'Todos los productos';
  });

  productoSeleccionado = computed(() => {
    const id = this.productoEditandoId();
    if (!id) return null;
    return this.state.productos().find(p => p.id === id) || null;
  });

  esBebidaSeleccionada = computed(() => this.productoSeleccionado()?.categoriaIngrediente?.tipoAplica === 'Bebida');

  detalleInsumo = this.state.detalleInsumo;
  costoBebida = this.state.costoBebida;

  porcentajeGananciaBebida = computed(() => {
    const categoriaId = this.state.detalleInsumo()?.categoriaId;
    if (categoriaId == null) return 0;
    return this.state.porcentajesBebidas().find(item => item.id === categoriaId)?.porcentaje ?? 0;
  });


  productosFiltrados = computed(() => {
    if (this.tabSeleccionada() === 'lotes') return [];
    return this.filtrarLista(this.state.productos());
  })

  productosDeBodega(bodega: Bodega): Insumo[] {
    return this.filtrarLista(bodega.insumos || []);
  }

  private filtrarLista(lista: Insumo[]): Insumo[] {
    const busqueda = this.termino().toLowerCase();
    const cat = this.categoria();

    let listaBase = lista;
    if (busqueda) {
      listaBase = listaBase.filter(p => p.nombre.toLowerCase().includes(busqueda));
    }
    if (cat.length > 0) {
      listaBase = listaBase.filter(p => p.categoriaIngrediente?.descripcion && cat.includes(p.categoriaIngrediente.descripcion));
    }
    return this.filtrarPorEstado(listaBase);
  }

  lotesVista = computed(() => {
    if (this.tabSeleccionada() !== 'lotes') return [];

    const busqueda = this.termino().toLowerCase();
    const cat = this.categoria();
    const productosPorId = new Map(this.state.productos().map(p => [p.id, p]));
    const bodegasPorId = new Map(this.bodegaState.bodegas().map(b => [b.id, b.nombre]));

    return this.state.lotes()
      .map(lote => ({
        lote,
        producto: productosPorId.get(lote.insumoId) || null,
        bodega: bodegasPorId.get(lote.bodegaId) || 'Sin bodega',
        unidad: productosPorId.get(lote.insumoId)?.unidadMedida.nombre || '',
        estadoClase: this.estadoLote(lote),
        estadoTexto: this.textoEstadoLote(lote)
      }))
      .filter(item => item.producto)
      .filter(item => {
        if (!busqueda) return true;
        return item.producto!.nombre.toLowerCase().includes(busqueda) ||
          item.lote.nombre.toLowerCase().includes(busqueda);
      })
      .filter(item => cat.length === 0 || cat.includes(item.producto!.categoriaIngrediente.descripcion));
  });

  lotesCriticos = computed(() => this.lotesVista().filter(item => item.estadoClase === 'danger').length);

  seleccionarBodegas() {
    this.bodegaState.cargarBodegasConInsumos();
    this.tabSeleccionada.set('bodegas');
  }

  seleccionarProductos() {
    this.tabSeleccionada.set('productos');
  }

  seleccionarEstado(estado: EstadoStockFiltro) {
    this.estadoFiltro.set(estado);
    if (this.tabSeleccionada() === 'lotes') {
      this.seleccionarProductos();
    }
  }

  seleccionarLotes() {
    this.state.cargarLotes();
    this.bodegaState.cargarBodegasConInsumos();
    this.tabSeleccionada.set('lotes');
  }

  limpiarFiltros() {
    this.termino.set('');
    this.categoria.set([]);
    this.tipoBodegaFiltro.set([]);
    this.estadoFiltro.set('todos');
  }

  seleccionarCategoria(nombre: string) {
    const actuales = this.categoria();
    this.categoria.set(
      actuales.includes(nombre) ? actuales.filter(c => c !== nombre) : [...actuales, nombre]
    );
  }

  limpiarCategoria() {
    this.categoria.set([]);
  }

  seleccionarTipoBodega(nombre: string) {
    const actuales = this.tipoBodegaFiltro();
    this.tipoBodegaFiltro.set(
      actuales.includes(nombre) ? actuales.filter(t => t !== nombre) : [...actuales, nombre]
    );
  }

  limpiarTipoBodega() {
    this.tipoBodegaFiltro.set([]);
  }

  private filtrarPorEstado(productos: Insumo[]): Insumo[] {
    const estado = this.estadoFiltro();
    if (estado === 'todos') return productos;

    return productos.filter((producto) => {
      const critico = producto.stockActual < producto.stockMinimo;
      const bajo = producto.stockActual >= producto.stockMinimo && producto.stockActual < producto.stockMinimo * 2;
      const ok = producto.stockActual >= producto.stockMinimo * 2;

      return (estado === 'criticos' && critico) ||
        (estado === 'bajos' && bajo) ||
        (estado === 'ok' && ok);
    });
  }

  ngOnInit() {
    this.state.cargarMercaderia();
    this.bodegaState.cargarBodegasConInsumos();
    this.state.cargarCatalogos();
    this.bodegaState.cargarTiposBodega();

    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        if (fragment === 'lotes') {
          this.seleccionarLotes();
        } else if (fragment === 'bodegas') {
          this.tabSeleccionada.set('bodegas');
        } else if (fragment === 'productos') {
          this.seleccionarProductos();
        }
      }
    });

    if (!this.tour.haVistoElTutorial()) {
      setTimeout(() => {
        this.tour.iniciarTour();
      }, 1200);
    }
  }

  iniciarTutorial(): void {
    this.tour.iniciarTour();
  }

  diasHastaVencimiento(lote: LoteInsumo): number {
    if (!lote.fechaVencimiento) return Number.POSITIVE_INFINITY;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(`${lote.fechaVencimiento}T00:00:00`);
    return Math.ceil((vencimiento.getTime() - hoy.getTime()) / 86400000);
  }

  estadoLote(lote: LoteInsumo): 'danger' | 'warning' | 'success' {
    const dias = this.diasHastaVencimiento(lote);
    if (dias <= 7) return 'danger';
    if (dias <= 30) return 'warning';
    return 'success';
  }

  textoEstadoLote(lote: LoteInsumo): string {
    const dias = this.diasHastaVencimiento(lote);
    if (!Number.isFinite(dias)) return 'Sin fecha';
    if (dias < 0) return 'Vencido';
    if (dias === 0) return 'Vence hoy';
    if (dias <= 7) return `${dias} días`;
    if (dias <= 30) return 'Próximo';
    return 'Ok';
  }

  abrirModalCrear(modal: Modal) {
    this.productoEditandoId.set(null);
    this.modalAbierto.set(true);
    modal.abrir();
  }

  abrirModalEditar(modal: Modal, id: number) {
    this.productoEditandoId.set(id);
    this.modalAbierto.set(true);
    modal.abrir();

    const producto = this.state.productos().find(p => p.id === id);
    const esBebida = producto?.categoriaIngrediente?.tipoAplica === 'Bebida';
    this.state.cargarDetalleInsumo(id, esBebida);
    if (esBebida) {
      this.state.cargarPorcentajesBebidas();
    }
  }

  limpiarEstadoModal() {
    this.productoEditandoId.set(null);
    this.modalAbierto.set(false);
    this.state.limpiarDetalleInsumo();
    this.state.limpiarError();
  }

  guardarCambios(payload: GuardarProductoPayload, modal: Modal) {
    this.state.guardarProducto(payload, () => {
      modal.cerrar();
      this.limpiarEstadoModal();
    });
  }

  guardarBebida(payload: GuardarBebidaPayload, modal: Modal) {
    const id = this.productoEditandoId();
    if (!id) return;

    this.state.guardarBebida(id, payload, () => {
      modal.cerrar();
      this.limpiarEstadoModal();
    });
  }

  abrirModalEliminar(id: number) {
    this.productoEliminandoId.set(id);
  }

  cerrarModalEliminar() {
    this.productoEliminandoId.set(null);
  }

  confirmarEliminar() {
    const id = this.productoEliminandoId();
    if (!id) return;

    this.state.eliminarProducto(id);
    this.productoEliminandoId.set(null);

    this.bodegaState.cargarBodegasConInsumos(true);
  }

  abrirModalBodegaCrear(modal: Modal) {
    this.bodegaEditandoId.set(null);
    modal.abrir();
  }

  abrirModalBodegaEditar(modal: Modal, id: number) {
    this.bodegaEditandoId.set(id);
    modal.abrir();
  }

  limpiarEstadoModalBodega() {
    this.bodegaEditandoId.set(null);
  }

  guardarBodega(payload: GuardarBodegaPayload, modal: Modal) {
    this.bodegaState.guardarBodega(payload);
  }

  abrirModalEliminarBodega(id: number) {
    this.bodegaEliminandoId.set(id);
  }

  cerrarModalEliminarBodega() {
    this.bodegaEliminandoId.set(null);
    this.bodegaState.resetEstados();
  }

  confirmarEliminarBodega() {
    const id = this.bodegaEliminandoId();
    if (!id) return;

    this.bodegaState.eliminarBodega(id);
  }

  abrirModalLoteCrear(modal: Modal) {
    this.loteEditandoId.set(null);
    this.state.limpiarError();
    modal.abrir();
  }

  abrirModalLoteEditar(modal: Modal, id: number) {
    this.loteEditandoId.set(id);
    this.state.limpiarError();
    modal.abrir();
  }

  limpiarEstadoModalLote() {
    this.loteEditandoId.set(null);
    this.state.limpiarError();
  }

  guardarLote(payload: LoteRequest, modal: Modal) {
    this.state.guardarLote(this.loteEditandoId(), payload, () => {
      modal.cerrar();
      this.limpiarEstadoModalLote();
    });
  }

  abrirModalEliminarLote(id: number) {
    this.state.limpiarError();
    this.loteEliminandoId.set(id);
  }

  cerrarModalEliminarLote() {
    this.loteEliminandoId.set(null);
    this.state.limpiarError();
  }

  confirmarEliminarLote() {
    const id = this.loteEliminandoId();
    if (!id) return;

    this.state.eliminarLote(id, () => {
      this.loteEliminandoId.set(null);
    });
  }

}
