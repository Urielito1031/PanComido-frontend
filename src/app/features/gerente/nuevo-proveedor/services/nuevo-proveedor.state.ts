import { computed, DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProveedorApiService } from '../../services/proveedor.api';
import { ProveedorNuevo } from '../../../../core/models/domain/proveedor';
import { CategoriaInsumo } from '../../../../core/models/domain/categoria-insumo';

@Injectable({ providedIn: 'root' })
export class NuevoProveedorState {
  private readonly api = inject(ProveedorApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly #categoriaIds = signal<number[]>([]);
  readonly #categoriasDisponibles = signal<CategoriaInsumo[]>([]);
  readonly #cargandoCategorias = signal(false);
  readonly #guardando = signal(false);
  readonly #errorCategorias = signal<string | null>(null);
  readonly #errorGuardado = signal<string | null>(null);

  readonly categoriaIds = this.#categoriaIds.asReadonly();
  readonly categoriasDisponibles = this.#categoriasDisponibles.asReadonly();
  readonly cargandoCategorias = this.#cargandoCategorias.asReadonly();
  readonly guardando = this.#guardando.asReadonly();
  readonly errorCategorias = this.#errorCategorias.asReadonly();
  readonly errorGuardado = this.#errorGuardado.asReadonly();

  readonly categorias = computed(() => {
    const seleccionadas = new Set(this.#categoriaIds());
    return this.#categoriasDisponibles()
      .filter(categoria => seleccionadas.has(categoria.id))
      .map(categoria => categoria.descripcion);
  });

  cargarCategorias(): void {
    this.#cargandoCategorias.set(true);
    this.#errorCategorias.set(null);
    this.api.getCategoriasInsumo()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: categorias => {
          this.#categoriasDisponibles.set(categorias);
          this.#cargandoCategorias.set(false);
        },
        error: () => {
          this.#categoriasDisponibles.set([]);
          this.#cargandoCategorias.set(false);
          this.#errorCategorias.set('No pudimos cargar las categorías de insumo.');
        }
      });
  }

  toggleCategoria(categoria: CategoriaInsumo): void {
    const idsActuales = [...this.#categoriaIds()];
    const idx = idsActuales.indexOf(categoria.id);
    if (idx >= 0) {
      idsActuales.splice(idx, 1);
    } else {
      idsActuales.push(categoria.id);
    }
    this.#categoriaIds.set(idsActuales);
    this.#errorGuardado.set(null);
  }

  removerCategoria(id: number): void {
    this.#categoriaIds.update(actuales => actuales.filter(categoriaId => categoriaId !== id));
    this.#errorGuardado.set(null);
  }

  resetearFormulario(): void {
    this.#categoriaIds.set([]);
    this.#errorGuardado.set(null);
  }

  guardarProveedor(proveedor: ProveedorNuevo, onSuccess: () => void): void {
    if (this.#guardando()) return;

    this.#guardando.set(true);
    this.#errorGuardado.set(null);
    this.api.crearProveedor(proveedor)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.#guardando.set(false);
          onSuccess();
        },
        error: () => {
          this.#guardando.set(false);
          this.#errorGuardado.set('No pudimos crear el proveedor. Revisa los datos e intenta nuevamente.');
        }
      });
  }
}
