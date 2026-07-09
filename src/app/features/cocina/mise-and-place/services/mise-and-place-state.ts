import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { MiseAndPlaceService } from './mise-and-place-service';
import { BodegaLightDto, CategoriaLightDto, DatosFormularioMiseAndPlaceDto, IngredienteMiseAndPlaceResponseDto, MiseAndPlaceListadoDto, UnidadMedidaResponseDto } from '../../../../core/models/dtos/responses/mise-and-place.response';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CrearMiseAndPlaceDto } from '../../../../core/models/dtos/requests/mise-and-place.request';

@Injectable({
  providedIn: 'root',
})
export class MiseAndPlaceState {

  private api = inject(MiseAndPlaceService);
  private destroyRef = inject(DestroyRef);

  readonly #items = signal<MiseAndPlaceListadoDto[]>([]);
  readonly #cargando = signal<boolean>(false);
  readonly #cargandoForm = signal(false);
  readonly #formData = signal<DatosFormularioMiseAndPlaceDto | null>(null);
  readonly #error = signal<string | null>(null);
  readonly #creando = signal<boolean>(false);
  readonly #mensajeExito = signal<string | null>(null);
  readonly #ultimoCreadoId = signal<number | null>(null);

  items = this.#items.asReadonly();
  cargando = this.#cargando.asReadonly();
  cargandoForm = this.#cargandoForm.asReadonly();
  formData = this.#formData.asReadonly();
  error = this.#error.asReadonly();
  creando = this.#creando.asReadonly();
  mensajeExito = this.#mensajeExito.asReadonly();
  ultimoCreadoId = this.#ultimoCreadoId.asReadonly();

  itemsPorVencer = computed(() => {
     return this.#items().filter((i) => i.fechaVencimiento).sort(
      (a, b) =>
      new Date(a.fechaVencimiento!).getTime() -
      new Date(b.fechaVencimiento!).getTime()
    );
  });

  categorias = computed(() => 
    this.#formData()?.categorias?? ([] as CategoriaLightDto[]));

  unidadesMedida = computed(() => 
    this.#formData()?.unidadesMedida?? ([] as UnidadMedidaResponseDto[]));

  bodegas = computed(() => 
    this.#formData()?.bodegas?? ([] as BodegaLightDto[]));

  ingredientesDisponibles  = computed(() => 
    this.#formData()?.ingredientes?? ([] as IngredienteMiseAndPlaceResponseDto[]));

  cargarListado(): void{ 
    this.#cargando.set(true);
    this.#error.set(null);

    this.api.listar().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.#items.set(data);
        this.#cargando.set(false);
      },
      error: (err) => {
        this.#error.set(err.message);
        this.#cargando.set(false);
      }
    });
  }
  cargarFormData(): void{
    if(this.#formData()) return;
    this.#cargandoForm.set(true);
    this.#error.set(null);
    this.api.obtenerFormData().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.#formData.set(data);
        this.#cargandoForm.set(false);
      },
      error: (err) => {
        this.#error.set(err.message);
        this.#cargandoForm.set(false);
      }
    });
  }

  crear(dto: CrearMiseAndPlaceDto): void {
    this.#creando.set(true);
    this.#error.set(null);

    this.api.crear(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => {
        this.#creando.set(false);
        this.#items.update(lista => [...lista, item]);
        this.#ultimoCreadoId.set(item.miseAndPlaceId);
        this.#mensajeExito.set(`${item.nombre} creado correctamente`);
        setTimeout(() => {
          this.#mensajeExito.set(null);
          this.#ultimoCreadoId.set(null);
        }, 3000);
      },
      error: (err) => {
        this.#error.set(err.message);
        this.#creando.set(false);
      },
    });
  }
}
