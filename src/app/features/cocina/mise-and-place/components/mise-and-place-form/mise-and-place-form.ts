import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnDestroy, output, signal, untracked } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { BodegaLightDto, CategoriaLightDto, IngredienteMiseAndPlaceResponseDto, MiseAndPlaceListadoDto, UnidadMedidaResponseDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

@Component({
  selector: 'app-mise-and-place-form',
  imports: [ReactiveFormsModule, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mise-and-place-form.html',
  styleUrl: './mise-and-place-form.css',
})
export class MiseAndPlaceForm implements OnDestroy {
  private fb = inject(FormBuilder);
  private valueChangesSub: Subscription | null = null;

  categorias = input.required<CategoriaLightDto[]>();
  unidadesMedida = input.required<UnidadMedidaResponseDto[]>();
  bodegas = input.required<BodegaLightDto[]>();
  ingredientes = input.required<IngredienteMiseAndPlaceResponseDto[]>();
  creando = input(false);
  editarItem = input<MiseAndPlaceListadoDto | null>(null);

  guardar = output<CrearMiseAndPlaceDto>();
  cancelar = output<void>();

  submitted = signal(false);
  errorDuplicado = signal<string | null>(null);
  mostrarAyudaRendimiento = signal(false);

  #arrayMinLength(min: number) {
    return (array: AbstractControl): ValidationErrors | null => {
      if (array instanceof FormArray && array.length >= min) return null;
      return { minLengthIng: { required: min } };
    };
  }

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    rendimientoBase: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fechaVencimiento: ['', Validators.required],
    unidadMedidaId: [null as number | null, Validators.required],
    categoriaId: [null as number | null, Validators.required],
    bodegaId: [null as number | null, Validators.required],
    ingredientes: this.fb.array([], [this.#arrayMinLength(1)]),
  });

  get ingredientesArray(): FormArray {
    return this.form.get('ingredientes') as FormArray;
  }

  constructor() {
    this.valueChangesSub = this.ingredientesArray.valueChanges.subscribe(() => {
      const calc = this.rendimientoCalculado;
      if (calc !== null) {
        this.form.get('rendimientoBase')?.setValue(calc, { emitEvent: false });
      }
    });

    effect(() => {
      const item = this.editarItem();
      untracked(() => this.#poblarFormulario(item));
    });
  }

  ngOnDestroy(): void {
    this.valueChangesSub?.unsubscribe();
  }

  #poblarFormulario(item: MiseAndPlaceListadoDto | null | undefined): void {
    this.submitted.set(false);
    this.errorDuplicado.set(null);
    this.form.reset();
    this.ingredientesArray.clear();

    if (item) {
      this.form.get('cantidad')?.clearValidators();
      this.form.get('cantidad')?.updateValueAndValidity();

      this.form.patchValue({
        nombre: item.nombre,
        descripcion: item.descripcion,
        cantidad: 0,
        rendimientoBase: item.rendimientoBase ?? 1,
        fechaVencimiento: item.fechaVencimiento ?? '',
        unidadMedidaId: this.#buscarId(item.unidadMedida, this.unidadesMedida()),
        categoriaId: this.#buscarId(item.categoria, this.categorias()),
        bodegaId: this.#buscarId(item.bodega, this.bodegas()),
      });

      for (const ing of item.receta) {
        this.agregarFila(ing.ingredienteId, ing.cantidad);
      }
    } else {
      this.agregarFila();
      this.form.get('rendimientoBase')?.setValue(1);
    }
  }

  get rendimientoCalculado() {
    const grupos = this.ingredientesArray.controls;
    let total = 0;
    for (const g of grupos) {
      const val = g.get('cantidad')?.value;
      if (val && !isNaN(val)) total += Number(val);
    }
    return total > 0 ? total : null;
  }

  get tandas() {
    const cant = this.form.get('cantidad')?.value;
    const rend = this.form.get('rendimientoBase')?.value;
    if (!cant || !rend || rend <= 0) return null;
    return cant / rend;
  }

  get consumoPreview(): { nombre: string; porTanda: number; total: number; um: string }[] {
    const tandasVal = this.tandas;
    if (!tandasVal) return [];

    const grupos = this.ingredientesArray.controls;
    const result: { nombre: string; porTanda: number; total: number; um: string }[] = [];

    for (const g of grupos) {
      const id = g.get('ingredienteId')?.value;
      const cantPorTanda = g.get('cantidad')?.value;
      if (!id || !cantPorTanda) continue;

      const info = this.infoIngrediente(id);
      if (!info) continue;

      result.push({
        nombre: info.nombre,
        porTanda: Number(cantPorTanda),
        total: Number(cantPorTanda) * tandasVal,
        um: info.unidadMedida,
      });
    }

    return result;
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

  ingredientesDisponiblesParaFila(index: number): IngredienteMiseAndPlaceResponseDto[] {
    const seleccionados = this.ingredientesArray.controls
      .map((c, i) => i !== index ? c.get('ingredienteId')?.value : null)
      .filter(v => v != null);

    return this.ingredientes().filter(ing => !seleccionados.includes(ing.id));
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
