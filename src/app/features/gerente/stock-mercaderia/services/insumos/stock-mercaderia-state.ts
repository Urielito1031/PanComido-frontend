import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Insumo, InsumoDetalle, CrearInsumo, LoteInsumo } from '../../../../../core/models/domain/insumo';
import { StockMercaderiaService } from './stock-mercaderia-service';
import { UnidadMedidaService } from '../unidad-medida.service';
import { CategoriaInsumoService } from '../categorias/categoria-insumo.service';
import { UnidadMedida } from '../../../../../core/models/domain/unidad-medida';
import { CategoriaInsumo } from '../../../../../core/models/domain/categoria-insumo';
import { PorcentajeItem } from '../../../../../core/models/domain/porcentajes-ganancia';
import { PlatoApiService } from '../../../services/plato.api';
import { GuardarBebidaPayload } from '../../components/editar-bebida-form/editar-bebida-form';
import { forkJoin } from 'rxjs';


@Injectable({
  providedIn: 'root',
})
export class StockMercaderiaState {
  private api = inject(StockMercaderiaService);
  private apiUnidadMedida = inject(UnidadMedidaService);
  private apiCategoriaInsumos = inject(CategoriaInsumoService);
  private platoApi = inject(PlatoApiService);
  private destroyRef = inject(DestroyRef);

  readonly #productos = signal<Insumo[]>([]);
  readonly #lotes = signal<LoteInsumo[]>([]);
  readonly #lotesCargados = signal<boolean>(false);
  readonly #unidadMedidas = signal<UnidadMedida[]>([]);
  readonly #categoriasInsumos = signal<CategoriaInsumo[]>([]);
  readonly #cargando = signal<boolean>(false);
  readonly #porcentajesBebidas = signal<PorcentajeItem[]>([]);
  readonly #bebidaDetalle = signal<InsumoDetalle | null>(null);
  readonly #costoBebida = signal<number>(0);

  productos = this.#productos.asReadonly();
  lotes = this.#lotes.asReadonly();
  lotesCargados = this.#lotesCargados.asReadonly();
  cargando = this.#cargando.asReadonly();
  unidadMedidas = this.#unidadMedidas.asReadonly();
  categoriasInsumos = this.#categoriasInsumos.asReadonly();
  porcentajesBebidas = this.#porcentajesBebidas.asReadonly();
  bebidaDetalle = this.#bebidaDetalle.asReadonly();
  costoBebida = this.#costoBebida.asReadonly();

  productosCriticos = computed(() =>
    this.#productos().filter(p => p.stockActual <= p.stockMinimo)
  );

  cantidadProductosCriticos = computed(() =>
    this.productosCriticos().length
  );

  cargarMercaderia(): void {
    this.#cargando.set(true);
    this.api.getStockMercaderia().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.#productos.set(data);
        this.#cargando.set(false);
      },
      error: (err) => {
        
        this.#cargando.set(false);
      }
    });
  }

  cargarLotes(): void {
    if (this.#lotesCargados()) return;

    this.api.getLotes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.#lotes.set(data);
        this.#lotesCargados.set(true);
      },
      error: () => {
        this.#lotes.set([]);
        this.#lotesCargados.set(true);
      }
    });
  }

  cargarCatalogos(): void { 
    forkJoin({
      categoriasRes: this.apiCategoriaInsumos.obtenerCategorias(),
      unidadesRes: this.apiUnidadMedida.obtenerUnidades()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.#categoriasInsumos.set(response.categoriasRes);
        this.#unidadMedidas.set(response.unidadesRes);
      },
      error: (err) => {}
    });
  }

  guardarProducto(producto: CrearInsumo): void {
    this.#cargando.set(true);
    
    const idEdicion = 'id' in producto ? (producto as any).id : null;

    if (idEdicion) {
      this.api.actualizar(idEdicion, producto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (updated) => {
          this.#productos.update(lista => 
            lista.map(p => p.id === updated.id ? updated : p)
          );
          this.#cargando.set(false);
        },
        error: () => this.#cargando.set(false)
      });
    } else {
      this.api.crear(producto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (nuevo: Insumo) => {
          const lotesEstabanCargados = this.#lotesCargados();
          this.#productos.update(lista => [...lista, nuevo]);
          this.#lotesCargados.set(false);
          if (lotesEstabanCargados) this.cargarLotes();
          this.#cargando.set(false);
          
        },
        error: (err) => {
          this.#cargando.set(false)
          

        }
      });
    }
  }

  eliminarProducto(id: number): void {
    this.#cargando.set(true);
    this.api.eliminar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.#productos.update(lista => lista.filter(p => p.id !== id));
        this.#cargando.set(false);
      },
      error: () => this.#cargando.set(false)
    });
  }

  cargarPorcentajesBebidas(): void {
    if (this.#porcentajesBebidas().length > 0) return;

    this.platoApi.getDatosFormulario()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.#porcentajesBebidas.set(res.porcentajes.bebidas)
      });
  }

  cargarDetalleBebida(id: number): void {
    this.#bebidaDetalle.set(null);
    this.#costoBebida.set(0);

    forkJoin({
      detalle: this.api.getById(id),
      articulos: this.platoApi.getPlatos()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ detalle, articulos }) => {
        const articulo = articulos.find(a => a.id === id);
        // GET /insumo/{id} no siempre trae urlImagen; usamos la que ya vino de carta/obtener-articulos como respaldo.
        this.#bebidaDetalle.set(detalle.urlImagen ? detalle : { ...detalle, urlImagen: articulo?.imagen || null });
        this.#costoBebida.set(articulo?.costo ?? 0);
      });
  }

  limpiarDetalleBebida(): void {
    this.#bebidaDetalle.set(null);
    this.#costoBebida.set(0);
  }

  guardarBebida(id: number, payload: GuardarBebidaPayload): void {
    const detalle = this.#bebidaDetalle();
    if (!detalle) return;

    this.#cargando.set(true);
    const request = {
      nombre: payload.nombre,
      descripcion: detalle.descripcion ?? undefined,
      precioVentaFinal: payload.precioVentaFinal,
      esPrecioManual: payload.esPrecioManual,
      stockMinimo: detalle.stockMinimo,
      stockRecomendado: detalle.stockRecomendado,
      categoriaId: detalle.categoriaId,
      unidadDeMedidaId: detalle.unidadDeMedidaId
    };

    this.api.actualizarInsumoConImagen(id, request, payload.imagen)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (actualizado) => {
          this.#productos.update(lista => lista.map(p => p.id === id
            ? { ...p, nombre: actualizado.nombre, precioVentaFinal: actualizado.precioVentaFinal ?? p.precioVentaFinal, esPrecioManual: actualizado.esPrecioManual }
            : p));
          this.#bebidaDetalle.set(null);
          this.#cargando.set(false);
        },
        error: () => this.#cargando.set(false)
      });
  }
}
