import { Component, OnInit, inject, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { Buscador } from '../../../../shared/ui/buscador/buscador';
import { Plato } from '../../../../core/models/domain/plato';
import { ListaPlatosComponent } from '../components/lista-platos/lista-platos';
import { PageToolbar } from '../../../../shared/ui/page-toolbar/page-toolbar';
import { Dropdown } from '../../../../shared/ui/dropdown/dropdown';
import { ModalEditarPlatoComponent } from '../containers/modal-editar-plato/modal-editar-plato';
import { ModalEliminarPlatoComponent } from '../components/modal-eliminar-plato/modal-eliminar-plato';
import { ModalRestaurarPlatoComponent } from '../components/modal-restaurar-plato/modal-restaurar-plato';
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
    ModalEliminarPlatoComponent,
    ModalRestaurarPlatoComponent
  ],
  templateUrl: './modificar-carta.html',
  styleUrls: ['./modificar-carta.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModificarCartaComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly documento = inject(DOCUMENT);
  readonly state = inject(ModificarCartaStateService);

  layoutMode = signal<'grid' | 'list'>('grid');

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

  ngOnInit() {
    this.state.cargarPlatos();

    this.route.queryParams.subscribe(params => {
      const buscar = params['buscar'];
      const editar = params['editar'] === 'true';
      if (buscar) {
        this.state.setSearchTerm(buscar);
        if (editar) {
          const checkAndEdit = () => {
            const list = this.state.platos();
            if (list.length > 0) {
              const plato = list.find(p => p.nombre.toLowerCase() === buscar.toLowerCase());
              if (plato) {
                this.state.setPlatoAEditar(plato);
              }
            } else {
              setTimeout(checkAndEdit, 100);
            }
          };
          checkAndEdit();
        }
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
    this.state.setPlatoAEditar(plato);
  }

  onDeletePlato(plato: Plato) {
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

  abrirRestaurarPlatos() {
    this.state.abrirModalRestaurar();
  }

  onCloseRestaurar() {
    this.state.cerrarModalRestaurar();
  }

  onRestaurarPlato(plato: Plato) {
    this.state.restaurarPlato(plato);
  }
}
