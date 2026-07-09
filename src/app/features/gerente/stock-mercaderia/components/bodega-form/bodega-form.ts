import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { TipoBodega } from '../../../../../core/models/domain/tipo-bodega';

export interface GuardarBodegaPayload {
  id?: number;
  nombre: string;
  tipoBodegaId: number;
}

@Component({
  selector: 'app-bodega-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bodega-form.html',
  styleUrl: './bodega-form.css'
})
export class BodegaForm {
  bodega = input<Bodega | null>(null);
  tiposBodega = input<TipoBodega[]>([]);
  errorAPI = input<string | null>(null);

  guardar = output<GuardarBodegaPayload>();
  cancelado = output<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', [Validators.required]],
      tipoBodegaId: ['', [Validators.required]]
    });

    effect(() => {
      const b = this.bodega();
      if (b) {
        this.form.patchValue({
          nombre: b.nombre,
          tipoBodegaId: b.tipoBodegaId || ''
        });
      } else {
        this.form.reset({ nombre: '', tipoBodegaId: '' });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      if (this.errorAPI()) {
        this.form.get('nombre')?.setValue('');
      }
    });
  }

  getError(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'Este campo es obligatorio';
    }
    return null;
  }

  onSubmit() {
    if (this.form.valid) {
      this.guardar.emit({
        id: this.bodega()?.id,
        nombre: this.form.value.nombre,
        tipoBodegaId: Number(this.form.value.tipoBodegaId)
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
