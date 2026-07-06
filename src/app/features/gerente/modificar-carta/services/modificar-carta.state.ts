import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlatoApiService } from '../../services/plato.api';
import { Plato } from '../../../../core/models/domain/plato';
import { PorcentajeItem } from '../../../../core/models/domain/porcentajes-ganancia';
import { environment } from '../../../../../environments/environment';
import {
  CartaSortOrder,
  esBebida,
  ordenarPlatosCarta,
  ordenarPorVisibilidad,
  tipoBebida,
  tipoComida,
  tiposDisponibles
} from './modificar-carta.rules';

@Injectable({ providedIn: 'root' })
export class ModificarCartaStateService {
  private api = inject(PlatoApiService);
  private destroyRef = inject(DestroyRef);

  // 1. Estado PRIVADO
  private _searchTerm = signal<string>('');
  private _selectedCategoria = signal<string | null>(null);
  private _platos = signal<Plato[]>([]);
  private _platoAEditar = signal<Plato | null>(null);
  private _platoAEliminar = signal<Plato | null>(null);
  private _explodingPlatoId = signal<number | null>(null);
  private _loading = signal<boolean>(false);
  private _selectedTipoBebida = signal<string | null>(null);
  private _selectedTipoComida = signal<string | null>(null);
  private _sortOrder = signal<CartaSortOrder>('default');

  private _porcentajesPlatos = signal<PorcentajeItem[]>([]);

  // 2. Estado PÚBLICO
  searchTerm = this._searchTerm.asReadonly();
  selectedCategoria = this._selectedCategoria.asReadonly();
  platos = this._platos.asReadonly();
  platoAEditar = this._platoAEditar.asReadonly();
  platoAEliminar = this._platoAEliminar.asReadonly();
  explodingPlatoId = this._explodingPlatoId.asReadonly();
  loading = this._loading.asReadonly();
  selectedTipoBebida = this._selectedTipoBebida.asReadonly();
  selectedTipoComida = this._selectedTipoComida.asReadonly();
  sortOrder = this._sortOrder.asReadonly();

  porcentajesPlatos = this._porcentajesPlatos.asReadonly();

  // 3. Variables Derivadas (Computed)
  tiposBebidaDisponibles = computed(() => {
    return tiposDisponibles(this._platos().filter(esBebida), tipoBebida);
  });

  totalBebidasCount = computed(() => {
    return this._platos().filter(esBebida).length;
  });

  categoriasDisponibles = computed(() => {
    const cats = new Set(this._platos().map(p => p.categoria).filter(c => !!c));
    return Array.from(cats).sort() as string[];
  });

  filteredPlatos = computed(() => {
    const sorted = ordenarPorVisibilidad(this._platos());

    const lowerTerm = this._searchTerm().toLowerCase().trim();
    const selectedCat = this._selectedCategoria();

    let result = sorted;
    if (lowerTerm) {
      result = result.filter(plato => 
        plato.nombre.toLowerCase().includes(lowerTerm)
      );
    }
    if (selectedCat) {
      result = result.filter(plato => 
        plato.categoria === selectedCat
      );
    }
    return result;
  });

  platosRecomendados = computed(() => {
    return this.filteredPlatos()
      .filter(plato => plato.recomendado && plato.visible)
      .sort((a, b) => (b.ventas ?? 0) - (a.ventas ?? 0));
  });

  platosNormales = computed(() => {
    return this.filteredPlatos().filter(plato => !(plato.recomendado && plato.visible));
  });

  tiposComidaDisponibles = computed(() => {
    return tiposDisponibles(this._platos().filter(plato => !esBebida(plato)), tipoComida);
  });

  totalComidasCount = computed(() => {
    return this._platos().filter(plato => !esBebida(plato)).length;
  });

  platosComidas = computed(() => {
    const selectedTipo = this._selectedTipoComida();
    const normal = this.filteredPlatos().filter(plato => {
      if (esBebida(plato) || (plato.recomendado && plato.visible)) return false;
      
      if (selectedTipo) {
        return tipoComida(plato) === selectedTipo;
      }
      return true;
    });
    return ordenarPlatosCarta(normal, this._sortOrder(), tipoComida);
  });

  platosBebidas = computed(() => {
    const selectedTipo = this._selectedTipoBebida();
    const normal = this.filteredPlatos().filter(plato => {
      if (!esBebida(plato) || (plato.recomendado && plato.visible)) return false;
      
      if (selectedTipo) {
        return tipoBebida(plato) === selectedTipo || plato.categoria === selectedTipo;
      }
      return true;
    });
    return ordenarPlatosCarta(normal, this._sortOrder(), tipoBebida);
  });

  // 4. Métodos de Negocio (UseCases)
  setTipoBebida(tipo: string | null): void {
    this._selectedTipoBebida.set(tipo);
  }

  setTipoComida(tipo: string | null): void {
    this._selectedTipoComida.set(tipo);
  }

  setSortOrder(order: CartaSortOrder): void {
    this._sortOrder.set(order);
  }

  cargarPlatos(): void {
    this._loading.set(true);
    this.api.getPlatos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (platos) => {
          this._platos.set(platos);
          this._loading.set(false);
        },
        error: () => this._loading.set(false)
      });
  }

  cargarPorcentajes(): void {
    this.api.getDatosFormulario()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this._porcentajesPlatos.set(res.porcentajes.platos)
      });
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  setCategoria(categoria: string | null): void {
    this._selectedCategoria.set(categoria);
  }

  toggleVisibility(plato: Plato): void {
    if (plato.visible) {
      this._explodingPlatoId.set(plato.id);

      setTimeout(() => {
        const targetState = false;
        this._platos.update(platos => platos.map(p => p.id === plato.id ? { ...p, visible: targetState } : p));
        this._explodingPlatoId.set(null);

        this.api.updatePlato(plato.id, { visible: targetState })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: updated => {
              this._platos.update(platos => platos.map(p => p.id === plato.id ? { ...p, ...updated } : p));
            },
            error: () => {
              this._platos.update(platos => platos.map(p => p.id === plato.id ? { ...p, visible: true } : p));
            }
          });
      }, 450);
    } else {
      const targetState = true;
      this._platos.update(platos => platos.map(p => p.id === plato.id ? { ...p, visible: targetState } : p));

      this.api.updatePlato(plato.id, { visible: targetState })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: updated => {
            this._platos.update(platos => platos.map(p => p.id === plato.id ? { ...p, ...updated } : p));
          },
          error: () => {
            this._platos.update(platos => platos.map(p => p.id === plato.id ? { ...p, visible: false } : p));
          }
        });
    }
  }

  setPlatoAEditar(plato: Plato | null): void {
    this._platoAEditar.set(plato);

    if (!plato) return;

    this.api.getPlatoById(plato.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: detalle => {
          this._platoAEditar.set({ ...plato, ...detalle });
        }
      });
  }

  setPlatoAEliminar(plato: Plato | null): void {
    this._platoAEliminar.set(plato);
  }

  savePlato(updatedFields: Partial<Plato>): void {
    const target = this._platoAEditar();
    if (!target) return;

    const updatedPlato = { ...target, ...updatedFields };
    const tipoPlatoId = updatedPlato.tipoPlatoId ?? target.tipoPlatoId;
    const categoriaPlatoId = updatedPlato.categoriaPlatoId ?? target.categoriaPlatoId;

    if (!tipoPlatoId || !categoriaPlatoId) return;

    const request = {
      nombre: updatedPlato.nombre,
      descripcion: updatedPlato.descripcion ?? '',
      precioVentaFinal: updatedPlato.precioVenta,
      tiempoPreparacionBase: updatedPlato.tiempoPreparacion ?? updatedPlato.tiempo ?? 1,
      esPrecioManual: updatedPlato.esPrecioManual ?? false,
      tipoPlatoId,
      categoriaPlatoId,
      urlImagen: this.normalizarUrlImagen(updatedPlato.imagen),
      esVisibleEnCarta: updatedPlato.visible,
      restriccionesIds: updatedPlato.restriccionesIds ?? [],
      ingredientes: (updatedPlato.receta ?? []).map(ingrediente => ({
        insumoId: Number(ingrediente.id),
        cantidad: ingrediente.cantidad,
        opcional: ingrediente.opcional ?? false
      }))
    };

    this.api.modificarPlato(target.id, request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => {
        this._platos.update(platos => platos.map(p => p.id === target.id ? { ...p, ...updated, ...updatedPlato } : p));
        this._platoAEditar.set(null);
      });
  }

  confirmDelete(): void {
    const target = this._platoAEliminar();
    if (!target) return;

    this.api.deletePlato(target.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this._platos.update(platos => platos.filter(p => p.id !== target.id));
        this._platoAEliminar.set(null);
      });
  }

  closeModals(): void {
    this._platoAEditar.set(null);
    this._platoAEliminar.set(null);
  }

  toggleRecomendado(plato: Plato): void {
    const targetState = !plato.recomendado;
    // Actualización optimista
    this._platos.update(platos =>
      platos.map(p => p.id === plato.id ? { ...p, recomendado: targetState } : p)
    );

    this.api.updatePlato(plato.id, { recomendado: targetState })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this._platos.update(platos =>
            platos.map(p => p.id === plato.id ? { ...p, ...updated } : p)
          );
        },
        error: () => {
          // Revertir en caso de error
          this._platos.update(platos =>
            platos.map(p => p.id === plato.id ? { ...p, recomendado: plato.recomendado } : p)
          );
        }
      });
  }

  private normalizarUrlImagen(url: string | undefined): string {
    if (!url) return '';

    return url.startsWith(environment.apiUrl) ? url.replace(environment.apiUrl, '') : url;
  }
}
