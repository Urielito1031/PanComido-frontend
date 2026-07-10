import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { CrearMiseAndPlaceDto, ModificarMiseAndPlaceDto, ProducirMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { MiseAndPlaceForm } from '../../components/mise-and-place-form/mise-and-place-form';
import { MiseAndPlaceListadoDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';
import { PageToolbar } from '../../../../../shared/ui/page-toolbar/page-toolbar';
import { Buscador } from '../../../../../shared/ui/buscador/buscador';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { UnidadNormalizadaPipe } from '../../../../../shared/pipes/unidad-normalizada.pipe';

type FiltroEstado = 'todos' | 'por-vencer' | 'proximo' | 'sin-fecha';

@Component({
  selector: 'app-list-page',
  imports: [MiseAndPlaceForm, ReactiveFormsModule, DatePipe, DecimalPipe, PageToolbar, Buscador, Modal, UnidadNormalizadaPipe],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
})
export class ListPage implements OnInit {
  state = inject(MiseAndPlaceState);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  modalFormulario = viewChild.required<Modal>('modalFormulario');
  editandoItem = signal<MiseAndPlaceListadoDto | null>(null);
  guardando = signal(false);
  errorGuardar = signal<string | null>(null);

  termino = signal('');
  estadoFiltro = signal<FiltroEstado>('todos');
  categoriaFiltro = signal('');

  categoriasDisponibles = computed(() => {
    const cats = this.state.items().map(i => i.categoria);
    return [...new Set(cats)].sort();
  });

  mostrarModalEliminar = signal(false);
  itemParaEliminar = signal<MiseAndPlaceListadoDto | null>(null);
  eliminando = signal(false);
  errorEliminar = signal<string | null>(null);

  mostrarModalGenerarStock = signal(false);
  itemParaGenerarStock = signal<MiseAndPlaceListadoDto | null>(null);
  produciendo = signal(false);
  errorProducir = signal<string | null>(null);

  formGenerarStock = this.fb.group({
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fechaVencimiento: ['', Validators.required],
    bodegaId: [null as number | null, Validators.required],
  });

  itemsFiltrados = computed(() => {
    let lista = this.state.items();
    const busq = this.termino().toLowerCase();

    if (busq) {
      lista = lista.filter(i => i.nombre.toLowerCase().includes(busq));
    }

    const estado = this.estadoFiltro();
    if (estado !== 'todos') {
      lista = lista.filter(i => {
        const ec = this.estadoVenc(i.fechaVencimiento);
        if (estado === 'por-vencer') return ec === 'rojo';
        if (estado === 'proximo') return ec === 'ambar';
        if (estado === 'sin-fecha') return ec === 'sin';
        return true;
      });
    }

    const cat = this.categoriaFiltro();
    if (cat) {
      lista = lista.filter(i => i.categoria === cat);
    }

    return lista;
  });

  totalItems = computed(() => this.state.items().length);
  itemsPorVencer = computed(() => this.state.items().filter(i => this.estadoVenc(i.fechaVencimiento) === 'rojo').length);
  itemsProximo = computed(() => this.state.items().filter(i => this.estadoVenc(i.fechaVencimiento) === 'ambar').length);
  itemsSinFecha = computed(() => this.state.items().filter(i => this.estadoVenc(i.fechaVencimiento) === 'sin').length);

  filtrosActivos = computed(() => {
    let total = 0;
    if (this.termino().trim()) total++;
    if (this.estadoFiltro() !== 'todos') total++;
    if (this.categoriaFiltro()) total++;
    return total;
  });

  ngOnInit(): void {
    this.state.cargarListado();
  }

  irADetalle(loteId: number): void {
    this.router.navigate(['/staff/cocina/mise-and-place', loteId]);
  }

  abrirModal(): void {
    this.editandoItem.set(null);
    this.errorGuardar.set(null);
    this.guardando.set(false);
    this.state.cargarFormData();
    this.modalFormulario().abrir();
  }

  cerrarModal(): void {
    this.modalFormulario().cerrar();
    this.editandoItem.set(null);
    this.guardando.set(false);
    this.errorGuardar.set(null);
  }

  onEditar(item: MiseAndPlaceListadoDto): void {
    this.editandoItem.set(item);
    this.errorGuardar.set(null);
    this.guardando.set(false);
    this.state.cargarFormData();
    this.modalFormulario().abrir();
  }

  onGuardar(dto: CrearMiseAndPlaceDto): void {
    this.errorGuardar.set(null);
    this.guardando.set(true);

    const editando = this.editandoItem();
    if (editando) {
      const modDto: ModificarMiseAndPlaceDto = {
        loteId: editando.loteId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        rendimientoBase: dto.rendimientoBase,
        fechaVencimiento: dto.fechaVencimiento,
        unidadMedidaId: dto.unidadMedidaId,
        categoriaId: dto.categoriaId,
        bodegaId: dto.bodegaId,
        ingredientes: dto.ingredientes,
      };
      this.state.modificar(editando.miseAndPlaceId, modDto, (error) => {
        if (error) {
          this.errorGuardar.set(error);
          this.guardando.set(false);
        } else {
          this.cerrarModal();
        }
      });
    } else {
      this.state.crear(dto, (error) => {
        if (error) {
          this.errorGuardar.set(error);
          this.guardando.set(false);
        } else {
          this.cerrarModal();
        }
      });
    }
  }

  abrirModalEliminar(item: MiseAndPlaceListadoDto): void {
    this.itemParaEliminar.set(item);
    this.errorEliminar.set(null);
    this.eliminando.set(false);
    this.mostrarModalEliminar.set(true);
  }

  cerrarModalEliminar(): void {
    this.mostrarModalEliminar.set(false);
    this.itemParaEliminar.set(null);
    this.eliminando.set(false);
    this.errorEliminar.set(null);
  }

  confirmarEliminar(): void {
    const item = this.itemParaEliminar();
    if (!item) return;
    this.eliminando.set(true);
    this.errorEliminar.set(null);
    this.state.eliminar(item.miseAndPlaceId, (error) => {
      if (error) {
        this.errorEliminar.set(error);
        this.eliminando.set(false);
      } else {
        this.cerrarModalEliminar();
      }
    });
  }

  abrirModalGenerarStock(item: MiseAndPlaceListadoDto): void {
    this.state.cargarFormData();
    this.formGenerarStock.reset();
    this.itemParaGenerarStock.set(item);
    this.errorProducir.set(null);
    this.produciendo.set(false);
    this.mostrarModalGenerarStock.set(true);
  }

  cerrarModalGenerarStock(): void {
    this.mostrarModalGenerarStock.set(false);
    this.itemParaGenerarStock.set(null);
    this.produciendo.set(false);
    this.errorProducir.set(null);
  }

  onSubmitGenerarStock(): void {
    if (this.formGenerarStock.invalid) return;
    const item = this.itemParaGenerarStock();
    if (!item) return;
    const dto: ProducirMiseAndPlaceDto = {
      cantidad: this.formGenerarStock.value.cantidad!,
      fechaVencimiento: this.formGenerarStock.value.fechaVencimiento!,
      bodegaId: this.formGenerarStock.value.bodegaId!,
    };
    this.errorProducir.set(null);
    this.produciendo.set(true);
    this.state.producir(item.miseAndPlaceId, dto, (error) => {
      if (error) {
        this.errorProducir.set(error);
        this.produciendo.set(false);
      } else {
        this.cerrarModalGenerarStock();
      }
    });
  }

  seleccionarEstado(estado: FiltroEstado): void {
    this.estadoFiltro.set(estado);
  }

  seleccionarCategoria(cat: string): void {
    this.categoriaFiltro.set(this.categoriaFiltro() === cat ? '' : cat);
  }

  limpiarFiltros(): void {
    this.termino.set('');
    this.estadoFiltro.set('todos');
    this.categoriaFiltro.set('');
  }

  estadoVenc(fecha: string | null): string {
    if (!fecha) return 'sin';
    const hoy = new Date();
    const ven = new Date(fecha);
    const diff = Math.ceil((ven.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 7) return 'rojo';
    if (diff <= 30) return 'ambar';
    return 'verde';
  }
}
