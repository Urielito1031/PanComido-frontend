import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MiseAndPlaceService } from './mise-and-place-service';
import { BodegaLightDto, CategoriaLightDto, DatosFormularioMiseAndPlaceDto, IngredienteMiseAndPlaceResponseDto, MiseAndPlaceListadoDto, UnidadMedidaResponseDto } from '../../../../core/models/dtos/responses/mise-and-place.response';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CrearMiseAndPlaceDto, ModificarMiseAndPlaceDto, ProducirMiseAndPlaceDto } from '../../../../core/models/dtos/requests/mise-and-place.request';

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

  #limpiarDecimales(texto: string): string {
    return texto.replace(/\b(\d+\.\d{5,})\b/g, (_, num) => {
      const n = parseFloat(num);
      return Number.isFinite(n) ? n.toFixed(4) : num;
    });
  }

  #errorMsg(err: HttpErrorResponse): string {
    if (typeof err.error === 'object' && err.error !== null) {
      const body = err.error as Record<string, unknown>;
      if (typeof body['error'] === 'string') return this.#limpiarDecimales(body['error'] as string);
      if (typeof body['mensaje'] === 'string') return this.#limpiarDecimales(body['mensaje'] as string);
      const errors = body['errors'] as Record<string, string[]>;
      if (errors && typeof errors === 'object') {
        const msgs = Object.values(errors).flat().filter(Boolean);
        if (msgs.length > 0) return this.#limpiarDecimales(msgs.join('; '));
      }
    }
    if (typeof err.error === 'string') {
      const match = err.error.match(/(?:Exception|Error):\s*(.+?)(?:\r?\n|$)/);
      if (match) return this.#limpiarDecimales(match[1].trim());
      return this.#limpiarDecimales(err.error.split('\r\n')[0].split('\n')[0].trim());
    }
    return err.statusText || err.message;
  }

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
        this.#error.set(this.#errorMsg(err));
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
        this.#error.set(this.#errorMsg(err));
        this.#cargandoForm.set(false);
      }
    });
  }

  crear(dto: CrearMiseAndPlaceDto, onComplete?: (error?: string) => void): void {
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
        onComplete?.();
      },
      error: (err) => {
        const msg = this.#errorMsg(err);
        this.#error.set(msg);
        this.#creando.set(false);
        onComplete?.(msg);
      },
    });
  }

  modificar(id: number, dto: ModificarMiseAndPlaceDto, onComplete?: (error?: string) => void): void {
    this.#creando.set(true);
    this.#error.set(null);

    this.api.modificar(id, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (item) => {
        this.#creando.set(false);
        this.#items.update(lista => lista.map(i => i.miseAndPlaceId === id ? item : i));
        this.#mensajeExito.set(`${item.nombre} modificado correctamente`);
        setTimeout(() => this.#mensajeExito.set(null), 3000);
        onComplete?.();
      },
      error: (err) => {
        const msg = this.#errorMsg(err);
        this.#error.set(msg);
        this.#creando.set(false);
        onComplete?.(msg);
      },
    });
  }

  eliminar(id: number, onComplete?: (error?: string) => void): void {
    this.#error.set(null);

    this.api.eliminar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.#items.update(lista => lista.filter(i => i.miseAndPlaceId !== id));
        this.#mensajeExito.set(response.mensaje);
        setTimeout(() => this.#mensajeExito.set(null), 3000);
        onComplete?.();
      },
      error: (err) => {
        const msg = this.#errorMsg(err);
        this.#error.set(msg);
        onComplete?.(msg);
      },
    });
  }

  producir(id: number, dto: ProducirMiseAndPlaceDto, onComplete?: (error?: string) => void): void {
    this.#creando.set(true);
    this.#error.set(null);

    this.api.producir(id, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.#creando.set(false);
        this.#mensajeExito.set(response.mensaje);
        this.cargarListado();
        setTimeout(() => this.#mensajeExito.set(null), 3000);
        onComplete?.();
      },
      error: (err) => {
        const msg = this.#errorMsg(err);
        this.#creando.set(false);
        onComplete?.(msg);
      },
    });
  }
}
