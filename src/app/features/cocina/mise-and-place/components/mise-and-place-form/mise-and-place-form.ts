import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { BodegaLightDto, CategoriaLightDto, IngredienteMiseAndPlaceResponseDto, MiseAndPlaceListadoDto, UnidadMedidaResponseDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

@Component({
  selector: 'app-mise-and-place-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mise-and-place-form.html',
  styleUrl: './mise-and-place-form.css',
})
export class MiseAndPlaceForm {
  private fb = inject(FormBuilder);

  categorias = input.required<CategoriaLightDto[]>();
  unidadesMedida = input.required<UnidadMedidaResponseDto[]>();
  bodegas = input.required<BodegaLightDto[]>();
  ingredientes = input.required<IngredienteMiseAndPlaceResponseDto[]>();
  creando = input(false);
  editarItem = input<MiseAndPlaceListadoDto | null>(null);

  guardar = output<CrearMiseAndPlaceDto>();
  cancelar = output<void>();

  submitted = signal(false);
  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    cantidad: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fechaVencimiento: ['', Validators.required],
    unidadMedidaId: [null as number | null, Validators.required],
    categoriaId: [null as number | null, Validators.required],
    bodegaId: [null as number | null, Validators.required],
    ingredientes: this.fb.array([]),
  });

  get ingredientesArray(): FormArray {
    return this.form.get('ingredientes') as FormArray;
  }

  ngOnInit(): void {
    const item = this.editarItem();
    if (item) {
      this.form.patchValue({
        nombre: item.nombre,
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        fechaVencimiento: item.fechaVencimiento ?? '',
        unidadMedidaId: this.#buscarId(item.unidadMedida, this.unidadesMedida()),
        categoriaId: this.#buscarId(item.categoria, this.categorias()),
        bodegaId: this.#buscarId(item.bodega, this.bodegas()),
      });

      for (const ing of item.receta) {
        this.ingredientesArray.push(
          this.fb.group({
            ingredienteId: [ing.ingredienteId, Validators.required],
            cantidad: [ing.cantidad, [Validators.required, Validators.min(0.01)]],
          })
        );
      }
    } else {
      this.agregarIngrediente();
    }
  }

  #buscarId(valor: string, lista: { id: number; nombre?: string; descripcion?: string }[]): number | null {
    const encontrado = lista.find(i => (i.nombre ?? i.descripcion) === valor);
    return encontrado?.id ?? null;
  }

  agregarIngrediente(): void {
    this.ingredientesArray.push(
      this.fb.group({
        ingredienteId: [null, Validators.required],
        cantidad: [null, [Validators.required, Validators.min(0.01)]],
      })
    );
  }

  quitarIngrediente(index: number): void {
    this.ingredientesArray.removeAt(index);
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.guardar.emit(this.form.value as unknown as CrearMiseAndPlaceDto);
  }
}