import { Component, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InsumoDetalle } from '../../../../../core/models/domain/insumo';
import { Bodega } from '../../../../../core/models/domain/bodega';

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CategoriaInsumo } from '../../../../../core/models/domain/categoria-insumo';
import { UnidadMedida } from '../../../../../core/models/domain/unidad-medida';

export const stockMinimoValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const stockMinimo = control.get('stockMinimo')?.value;
  const stockInicial = control.get('stockInicial')?.value;

  if (stockMinimo !== null && stockInicial !== null && stockInicial < stockMinimo) {
    return { stockInsuficiente: true };
  }
  return null;
};

export interface GuardarProductoPayload {
  id?: number;
  nombre: string;
  descripcion: string;
  categoriaId: number;
  unidadDeMedidaId: number;
  stockMinimo: number;
  stockRecomendado: number;
  precioVentaFinal?: number;
  esPrecioManual: boolean;
  bodegaId?: number;
  cantidadInicial?: number;
  fechaVencimiento?: string;
  imagen?: File;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-producto-form',
  imports: [ReactiveFormsModule],
  templateUrl: './producto-form.html',
  styleUrls: ['./producto-form.css'],
})
export class ProductoForm {
  private fb = inject(FormBuilder);

  producto = input<InsumoDetalle | null>(null);
  bodegas = input<Bodega[]>([]);
  categorias = input<CategoriaInsumo[]>([]);
  unidadesMedida = input<UnidadMedida[]>([]);
  nombrePlaceholder = input<string>('Ej: Tomate perita');
  guardar = output<GuardarProductoPayload>();
  cancelado = output<void>();

  form!: FormGroup;
  imagenPreview = signal<string | null>(null);
  archivoImagen = signal<File | null>(null);

  ngOnInit() {
    this.initForm();

    const prod = this.producto();
    if (prod) {
      this.form.patchValue({
        nombre: prod.nombre,
        descripcion: prod.descripcion ?? '',
        categoriaId: prod.categoriaId,
        unidadDeMedidaId: prod.unidadDeMedidaId,
        stockMinimo: prod.stockMinimo,
        stockRecomendado: prod.stockRecomendado,
        precioVentaFinal: prod.precioVentaFinal ?? 0
      });
      this.imagenPreview.set(prod.urlImagen);

      ['bodegaId', 'stockInicial', 'fechaVencimiento'].forEach(campo => {
        this.form.get(campo)?.clearValidators();
        this.form.get(campo)?.updateValueAndValidity();
      });
      this.form.clearValidators();
      this.form.updateValueAndValidity();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      categoriaId: ['', Validators.required],
      unidadDeMedidaId: ['', Validators.required],
      stockMinimo: [0, [Validators.required, Validators.min(0)]],
      stockRecomendado: [0, [Validators.required, Validators.min(0)]],
      precioVentaFinal: [0, Validators.min(0)],
      stockInicial: [0, [Validators.required, Validators.min(0)]],
      bodegaId: ['', Validators.required],
      fechaVencimiento: ['', Validators.required]
    }, { validators: stockMinimoValidator });
  }

  categoriaSeleccionadaEsBebida(): boolean {
    const categoriaId = Number(this.form.get('categoriaId')?.value);
    return this.categorias().find(cat => cat.id === categoriaId)?.tipoAplica === 'Bebida';
  }

  puedeGuardar(): boolean {
    if (this.form.invalid) return false;
    if (!this.producto() && this.categoriaSeleccionadaEsBebida() && !this.archivoImagen()) return false;
    return true;
  }

  onFocusNumero(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') {
      input.value = '';
    }
  }

  onImagenSeleccionada(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.archivoImagen.set(archivo);
    this.imagenPreview.set(URL.createObjectURL(archivo));
  }

  onSubmit(): void {
    if (!this.puedeGuardar()) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const prod = this.producto();

    const payload: GuardarProductoPayload = {
      id: prod?.id,
      nombre: formValue.nombre,
      descripcion: formValue.descripcion || '',
      categoriaId: Number(formValue.categoriaId),
      unidadDeMedidaId: Number(formValue.unidadDeMedidaId),
      stockMinimo: Number(formValue.stockMinimo),
      stockRecomendado: Number(formValue.stockRecomendado),
      precioVentaFinal: prod ? prod.precioVentaFinal : (Number(formValue.precioVentaFinal) || undefined),
      esPrecioManual: prod?.esPrecioManual ?? false,
      imagen: this.archivoImagen() ?? undefined
    };

    if (!prod) {
      payload.bodegaId = Number(formValue.bodegaId);
      payload.cantidadInicial = Number(formValue.stockInicial);
      payload.fechaVencimiento = formValue.fechaVencimiento;
    }

    this.guardar.emit(payload);
    this.form.reset({
      stockMinimo: 0,
      stockRecomendado: 0,
      precioVentaFinal: 0,
      stockInicial: 0
    });
    this.archivoImagen.set(null);
    this.imagenPreview.set(null);
  }

  getError(campo: string): string | null {
    const control = this.form.get(campo);

    if (!control || !control.touched) return null;

    if (control.hasError('required')) return 'Este campo es obligatorio';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres`;
    if (control.hasError('min')) return `El valor mínimo es ${control.getError('min').min}`;

    if (campo === 'stockInicial' && this.form.hasError('stockInsuficiente')) {
       return 'La cantidad inicial no puede ser menor al stock mínimo';
    }

    return null;
  }
}
