import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Buscador } from '../../../../../shared/ui/buscador/buscador';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { CategoriaLightDto, IngredienteMiseAndPlaceResponseDto, MiseAndPlaceListadoDto, UnidadMedidaResponseDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

@Component({
  selector: 'app-mise-and-place-form',
  imports: [ReactiveFormsModule, DecimalPipe, Buscador],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mise-and-place-form.html',
  styleUrl: './mise-and-place-form.css',
})
export class MiseAndPlaceForm {
  private fb = inject(FormBuilder);

  categorias = input.required<CategoriaLightDto[]>();
  unidadesMedida = input.required<UnidadMedidaResponseDto[]>();
  ingredientes = input.required<IngredienteMiseAndPlaceResponseDto[]>();
  creando = input(false);
  editarItem = input<MiseAndPlaceListadoDto | null>(null);
  errorGuardar = input<string | null>(null);

  guardar = output<CrearMiseAndPlaceDto>();
  cancelar = output<void>();

  submitted = signal(false);
  errorDuplicado = signal<string | null>(null);
  busqueda = signal('');

  #arrayMinLength(min: number) {
    return (array: AbstractControl): ValidationErrors | null => {
      if (array instanceof FormArray && array.length >= min) return null;
      return { minLengthIng: { required: min } };
    };
  }

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    unidadMedidaId: [null as number | null, Validators.required],
    categoriaId: [null as number | null, Validators.required],
    stockMinimo: [0, [Validators.min(0)]],
    stockRecomendado: [0, [Validators.min(0)]],
    ingredientes: this.fb.array([], [this.#arrayMinLength(1)]),
  });

  get ingredientesArray(): FormArray {
    return this.form.get('ingredientes') as FormArray;
  }

  constructor() {
    effect(() => {
      const item = this.editarItem();
      untracked(() => this.#poblarFormulario(item));
    });
  }

  #poblarFormulario(item: MiseAndPlaceListadoDto | null | undefined): void {
    this.submitted.set(false);
    this.errorDuplicado.set(null);
    this.form.reset();
    this.ingredientesArray.clear();

    if (item) {
      this.form.patchValue({
        nombre: item.nombre,
        descripcion: item.descripcion,
        unidadMedidaId: this.#buscarId(item.unidadMedida, this.unidadesMedida()),
        categoriaId: this.#buscarId(item.categoria, this.categorias()),
        stockMinimo: item.stockMinimo ?? 0,
        stockRecomendado: item.stockRecomendado ?? 0,
      });

      for (const ing of item.receta) {
        this.agregarFila(ing.ingredienteId, ing.cantidad);
      }
    } else {
      this.form.patchValue({ stockMinimo: 0, stockRecomendado: 0 });
    }
  }

  #buscarId(valor: string, lista: { id: number; nombre?: string; descripcion?: string }[]): number | null {
    const encontrado = lista.find(i => (i.nombre ?? i.descripcion) === valor);
    return encontrado?.id ?? null;
  }

  agregarFila(ingredienteId?: number, cantidad?: number): void {
    this.ingredientesArray.push(
      this.fb.group({
        ingredienteId: [ingredienteId ?? null, Validators.required],
        cantidad: [cantidad ?? null, [Validators.required, Validators.min(0.01)]],
      })
    );
  }

  quitarIngrediente(index: number): void {
    this.ingredientesArray.removeAt(index);
  }

  infoIngrediente(id: number | null): IngredienteMiseAndPlaceResponseDto | undefined {
    if (id === null) return undefined;
    return this.ingredientes().find(i => i.id === id);
  }

  onSearchChanged(value: string): void {
    this.busqueda.set(value);
  }

  sugerencias(): IngredienteMiseAndPlaceResponseDto[] {
    const query = this.busqueda().toLowerCase().trim();
    if (!query) return [];

    const seleccionados = this.ingredientesArray.controls
      .map(c => c.get('ingredienteId')?.value)
      .filter(v => v != null);

    return this.ingredientes().filter(ing =>
      ing.nombre.toLowerCase().includes(query) && !seleccionados.includes(ing.id)
    );
  }

  agregarIngrediente(ing: IngredienteMiseAndPlaceResponseDto): void {
    this.agregarFila(ing.id);
    this.busqueda.set('');
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.errorDuplicado.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const ids = this.ingredientesArray.controls.map(c => c.get('ingredienteId')?.value).filter(v => v != null);
    const duplicados = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (duplicados.length > 0) {
      this.errorDuplicado.set('No podés agregar el mismo ingrediente más de una vez en la receta.');
      return;
    }

    this.guardar.emit(this.form.value as unknown as CrearMiseAndPlaceDto);
  }
}
