import { Component, effect, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Insumo, LoteInsumo } from '../../../../../core/models/domain/insumo';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { LoteRequest } from '../../../../../core/models/dtos/requests/lote.request';

@Component({
  selector: 'app-lote-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lote-form.html',
  styleUrl: './lote-form.css'
})
export class LoteForm {
  private fb = inject(FormBuilder);

  lote = input<LoteInsumo | null>(null);
  insumos = input<Insumo[]>([]);
  bodegas = input<Bodega[]>([]);
  errorAPI = input<string | null>(null);
  guardando = input<boolean>(false);

  guardar = output<LoteRequest>();
  cancelado = output<void>();

  form = this.fb.group({
    insumoId: ['', [Validators.required]],
    cantidad: [0, [Validators.required, Validators.min(0.01)]],
    fechaVencimiento: ['', [Validators.required]],
    bodegaId: ['', [Validators.required]]
  });

  constructor() {
    effect(() => {
      const lote = this.lote();
      if (lote) {
        this.form.reset({
          insumoId: String(lote.insumoId),
          cantidad: lote.cantidad,
          fechaVencimiento: lote.fechaVencimiento ?? '',
          bodegaId: String(lote.bodegaId)
        });
      } else {
        this.form.reset({
          insumoId: '',
          cantidad: 0,
          fechaVencimiento: '',
          bodegaId: ''
        });
      }
    }, { allowSignalWrites: true });
  }

  getError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control?.invalid || (!control.dirty && !control.touched)) return null;

    if (control.errors?.['required']) return 'Este campo es obligatorio';
    if (control.errors?.['min']) return 'Debe ser mayor a 0';

    return null;
  }

  onFocusNumero(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') input.select();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.guardar.emit({
      insumoId: Number(value.insumoId),
      cantidad: Number(value.cantidad),
      fechaVencimiento: value.fechaVencimiento!,
      bodegaId: Number(value.bodegaId)
    });
  }
}
