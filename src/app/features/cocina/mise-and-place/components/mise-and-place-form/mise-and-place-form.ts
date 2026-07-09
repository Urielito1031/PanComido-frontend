import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { BodegaLightDto, CategoriaLightDto, IngredienteMiseAndPlaceResponseDto, UnidadMedidaResponseDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

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

  guardar = output<CrearMiseAndPlaceDto>();
  cancelar = output<void>();

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    cantidad: [0, [Validators.required, Validators.min(0.01)]],
    fechaVencimiento: ['', Validators.required],
    unidadMedidaId: [0, Validators.required],
    categoriaId: [0, Validators.required],
    bodegaId: [0, Validators.required],
    ingredientes: this.fb.array([]),
  });

  get ingredientesArray(): FormArray {
    return this.form.get('ingredientes') as FormArray;
  }

  ngOnInit(): void {
    this.agregarIngrediente();
  }

  agregarIngrediente(): void {
    this.ingredientesArray.push(
      this.fb.group({
        ingredienteId: [0, Validators.required],
        cantidad: [0, [Validators.required, Validators.min(0.01)]],
      })
    );
  }

  quitarIngrediente(index: number): void {
    this.ingredientesArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.guardar.emit(this.form.value as unknown as CrearMiseAndPlaceDto);
  }
}