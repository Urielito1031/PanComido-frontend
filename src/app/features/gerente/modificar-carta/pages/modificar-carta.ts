import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed, DestroyRef, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Buscador } from '../../../../shared/ui/buscador/buscador';
import { Plato } from '../../../../core/models/domain/plato';
import { ListaPlatosComponent } from '../components/lista-platos/lista-platos';
import { PageToolbar } from '../../../../shared/ui/page-toolbar/page-toolbar';
import { Dropdown } from '../../../../shared/ui/dropdown/dropdown';
import { ModalEditarPlatoComponent } from '../containers/modal-editar-plato/modal-editar-plato';
import { ModalEliminarPlatoComponent } from '../components/modal-eliminar-plato/modal-eliminar-plato';
import { ModificarCartaStateService } from '../services/modificar-carta.state';

@Component({
  selector: 'app-modificar-carta',
  standalone: true,
  imports: [
    Buscador, 
    ListaPlatosComponent, 
    Dropdown, 
    PageToolbar,
    ModalEditarPlatoComponent,
    ModalEliminarPlatoComponent
  ],
  templateUrl: './modificar-carta.html',
  styleUrls: ['./modificar-carta.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModificarCartaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private readonly documento = inject(DOCUMENT);
  readonly state = inject(ModificarCartaStateService);

  layoutMode = signal<'grid' | 'list'>('grid');
  isFloatingMenuOpen = signal(false);
  private platoPendienteEdicion = signal<string | null>(null);
  private scrollPosition = 0;

  // Exponer señales del State Service para que la plantilla HTML y los tests sigan funcionando sin cambios
  platos = this.state.platos;
  filteredPlatos = this.state.filteredPlatos;
  platosRecomendados = this.state.platosRecomendados;
  platosComidas = this.state.platosComidas;
  platosBebidas = this.state.platosBebidas;
  explodingPlatoId = this.state.explodingPlatoId;
  platoAEditar = this.state.platoAEditar;
  platoAEliminar = this.state.platoAEliminar;
  selectedCategoria = this.state.selectedCategoria;
  loading = this.state.loading;
  categoriasDisponibles = this.state.categoriasDisponibles;
  tiposBebidaDisponibles = this.state.tiposBebidaDisponibles;
  selectedTipoBebida = this.state.selectedTipoBebida;
  totalBebidasCount = this.state.totalBebidasCount;

  tiposComidaDisponibles = this.state.tiposComidaDisponibles;
  selectedTipoComida = this.state.selectedTipoComida;
  totalComidasCount = this.state.totalComidasCount;

  sortOrder = this.state.sortOrder;
  porcentajesPlatos = this.state.porcentajesPlatos;

  readonly opcionesOrden: { valor: string; etiqueta: string; icono: string }[] = [
    { valor: 'default',     etiqueta: 'Por Relevancia', icono: 'tune'          },
    { valor: 'ventas-desc', etiqueta: 'Más Vendidos',   icono: 'trending_up'   },
    { valor: 'ventas-asc',  etiqueta: 'Menos Vendidos', icono: 'trending_down' },
    { valor: 'precio-desc', etiqueta: 'Mayor Precio',   icono: 'arrow_upward'  },
    { valor: 'precio-asc',  etiqueta: 'Menor Precio',   icono: 'arrow_downward'},
  ];

  ordenActivo = computed(() => {
    return this.opcionesOrden.find(o => o.valor === this.state.sortOrder()) ?? this.opcionesOrden[0];
  });

  constructor() {
    effect(() => {
      const nombrePendiente = this.platoPendienteEdicion();
      if (!nombrePendiente) return;

      const plato = this.state.platos().find(item => item.nombre.toLowerCase() === nombrePendiente.toLowerCase());
      if (!plato) return;

      this.state.setPlatoAEditar(plato);
      this.platoPendienteEdicion.set(null);
    });
  }

  ngOnInit() {
    this.state.cargarPlatos();
    this.state.cargarPorcentajes();

    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
      const buscar = params['buscar'];
      const editar = params['editar'] === 'true';
      if (!buscar) {
        this.state.setSearchTerm('');
        this.platoPendienteEdicion.set(null);
        return;
      }

      this.state.setSearchTerm(buscar);
      if (editar) {
        this.platoPendienteEdicion.set(buscar);
      }
    });

    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(fragment => {
      if (fragment) {
        setTimeout(() => this.desplazarASeccion(fragment), 150);
      }
    });
  }

  onTipoBebidaSeleccionado(tipo: string | null) {
    this.state.setTipoBebida(tipo);
  }

  onTipoComidaSeleccionado(tipo: string | null) {
    this.state.setTipoComida(tipo);
  }


  setOrden(valor: string, dropdown: { cerrar: () => void }) {
    this.state.setSortOrder(valor as 'default' | 'ventas-desc' | 'ventas-asc' | 'precio-desc' | 'precio-asc');
    dropdown.cerrar();
  }

  resetOrden(event: Event) {
    event.stopPropagation();
    this.state.setSortOrder('default');
  }

  toggleRecomendado(plato: Plato) {
    this.state.toggleRecomendado(plato);
  }

  onSearch(term: string) {
    this.state.setSearchTerm(term);
  }

  toggleVisibility(plato: Plato) {
    this.state.toggleVisibility(plato);
  }

  onEditPlato(plato: Plato) {
    this.scrollPosition = window.scrollY;
    this.state.setPlatoAEditar(plato);
  }

  onDeletePlato(plato: Plato) {
    this.scrollPosition = window.scrollY;
    this.state.setPlatoAEliminar(plato);
  }

  onSavePlato(updatedFields: Partial<Plato>) {
    this.state.savePlato(updatedFields);
  }

  onConfirmDelete() {
    this.state.confirmDelete();
  }

  onCloseModals() {
    this.state.closeModals();
    setTimeout(() => window.scrollTo(0, this.scrollPosition), 50);
  }

  onCategoriaSeleccionada(categoria: string | null) {
    this.state.setCategoria(categoria);
  }

  irACrearPlato() {
    this.router.navigate(['/staff/gerente/crear-plato']);
  }

  desplazarASeccion(id: string) {
    const element = this.documento.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  desplazarAlPrincipio() {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setLayoutMode(mode: 'grid' | 'list') {
    this.layoutMode.set(mode);
  }
}
