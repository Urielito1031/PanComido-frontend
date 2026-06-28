import { computed, inject, Injectable, signal } from '@angular/core';
import { CartaItem } from '../../../../core/models/domain/carta-item';
import { CartaService } from './carta-service';

@Injectable({
  providedIn: 'root',
})
export class CartaState {

  private api = inject(CartaService);
  private _items = signal<CartaItem[]>([]);
  private _cargando = signal(false);
  private _cargandoId: number | null = null;
  private _cache = new Map<number, CartaItem[]>();

  items = this._items.asReadonly();
  cargando = this._cargando.asReadonly();

  // Filtros
  busqueda = signal('');
  tiposSeleccionados = signal<string[]>([]);
  ordenarPor = signal('');
  categoriasSeleccionadas = signal<string[]>([]);
restriccionesSeleccionadas = signal<string[]>([]);


  

toggleCategoria(categoria: string): void {
  this.categoriasSeleccionadas.update(actual => {
    if (actual.includes(categoria)) {
      return actual.filter(c => c !== categoria);
    }

    return [...actual, categoria];
  });
}

  // Computed: platos
  platos = computed(() =>
    this._items().filter(i => i.esPlato === true)
  );

  // Computed: bebidas
  bebidas = computed(() =>
    this._items().filter(i => i.esPlato === false)
  );

  private readonly CATEGORIAS_PLATO = new Set(['Entrada', 'Principal', 'Postre', 'Guarnición']);
  private readonly CATEGORIAS_BEBIDA = new Set(['Con alcohol', 'Sin alcohol']);

  // Items filtrados (para la vista)
  itemsFiltrados = computed(() => {
    let resultado = this._items();
    const categorias = this.categoriasSeleccionadas();
    const tipos = this.tiposSeleccionados();

    const restricciones = this.restriccionesSeleccionadas();

    if (restricciones.length > 0) {
      resultado = resultado.filter(item =>
        restricciones.every(r => item.restricciones?.includes(r))
      );
    }

    const categoriasPlato = categorias.filter(c => this.CATEGORIAS_PLATO.has(c));
    const categoriasBebida = categorias.filter(c => this.CATEGORIAS_BEBIDA.has(c));

    const filtraPlatos = tipos.includes('Plato') || categoriasPlato.length > 0;
    const filtraBebidas = tipos.includes('Bebida') || categoriasBebida.length > 0;

    if (filtraPlatos || filtraBebidas) {
      resultado = resultado.filter(item => {
        if (item.esPlato) {
          if (!filtraPlatos) return false;
          return categoriasPlato.length === 0 || categoriasPlato.includes(item.categoriaPlato ?? '');
        } else {
          if (!filtraBebidas) return false;
          return categoriasBebida.length === 0 || categoriasBebida.includes(item.categoriaBebida ?? '');
        }
      });
    }

    // Filtro por búsqueda (solo nombre, descripcion no existe)
    const busqueda = this.busqueda().toLowerCase();
    if (busqueda) {
      resultado = resultado.filter(i =>
        i.nombre.toLowerCase().includes(busqueda)
      );
    }

    // Ordenamiento
    const orden = this.ordenarPor();
    switch (orden) {
      case 'precio-menor':
        resultado = [...resultado].sort((a, b) => a.precio - b.precio);
        break;
      case 'precio-mayor':
        resultado = [...resultado].sort((a, b) => b.precio - a.precio);
        break;
      case 'nombre':
        resultado = [...resultado].sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        break;
      case 'tiempo':
        resultado = [...resultado].sort((a, b) => {
          const ta = a.tiempoPreparacionEstimado ?? Infinity;
          const tb = b.tiempoPreparacionEstimado ?? Infinity;
          return ta - tb;
        });
        break;
    }

    return resultado;
  });

  cargarCarta(restauranteId: number): void {
    // Cache hit — devolvemos lo que ya tenemos
    if (this._cache.has(restauranteId)) {
      this._items.set(this._cache.get(restauranteId)!);
      return;
    }
    // Ya hay un request en vuelo para este ID — no duplicamos
    if (this._cargandoId === restauranteId) return;

    this._cargandoId = restauranteId;
    this._cargando.set(true);
    this.api.obtenerCarta(restauranteId).subscribe({
      next: (data) => {
        this._cache.set(restauranteId, data);
        this._items.set(data);
        this._cargando.set(false);
        this._cargandoId = null;
      },
      error: () => {
        this._cargando.set(false);
        this._cargandoId = null;
      }
    });
  }

  setBusqueda(valor: string): void {
    this.busqueda.set(valor);
  }

  setOrdenar(valor: string): void {
    this.ordenarPor.set(valor);
  }

  toggleTipoPlato(tipo: string): void {
    this.tiposSeleccionados.update(tipos => {
      if (tipos.includes(tipo)) {
        return tipos.filter(t => t !== tipo);
      }
      return [...tipos, tipo];
    });
  }

  toggleRestriccion(restriccion: string): void {
  this.restriccionesSeleccionadas.update(actual => {
    if (actual.includes(restriccion)) {
      return actual.filter(r => r !== restriccion);
    }
    return [...actual, restriccion];
  });
}

  // limpiarFiltros(): void {
  //   this.busqueda.set('');
  //   this.tiposSeleccionados.set([]);
  //   this.ordenarPor.set('');
  // }

  limpiarFiltros(): void {
  this.busqueda.set('');
  this.tiposSeleccionados.set([]);
  this.categoriasSeleccionadas.set([]);
  this.ordenarPor.set('');
  this.restriccionesSeleccionadas.set([]);
}

  // tieneFiltrosActivos = computed(() =>
  //   this.tiposSeleccionados().length > 0
  // );
tieneFiltrosActivos = computed(() =>
  this.tiposSeleccionados().length > 0 ||
  this.categoriasSeleccionadas().length > 0 ||
  this.restriccionesSeleccionadas().length > 0 ||
  this.busqueda().trim() !== '' ||
  this.ordenarPor() !== ''
);

  cantidadFiltrosActivos = computed(() =>
    this.tiposSeleccionados().length +
    this.categoriasSeleccionadas().length +
    this.restriccionesSeleccionadas().length
  );

  
}

