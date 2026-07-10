import { Component, inject, input, output, computed, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { ItemDesplegableDto } from '../../../services/plato.api';
import { PorcentajeItem } from '../../../../../core/models/domain/porcentajes-ganancia';
import { calcularPrecioConGanancia } from '../../../services/plato-cost';

export interface PlatoFormData {
  nombre: string;
  costo: number;
  precioVenta: number;
  esPrecioManual: boolean;
  tiempoPreparacion: number;
  tipoPlatoId: number;
  categoriaPlatoId: number;
  descripcion: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-crear-plato-form',
  standalone: true,
  imports: [ReactiveFormsModule, Boton],
  templateUrl: './crear-plato-form.html',
  styleUrl: './crear-plato-form.css'
})
export class CrearPlatoFormComponent {
  private readonly fb = inject(FormBuilder);

  // Inputs
  costoSugerido = input<number>(0);
  tiposPlato = input<ItemDesplegableDto[]>([]);
  categoriasPlato = input<ItemDesplegableDto[]>([]);
  porcentajesPlatos = input<PorcentajeItem[]>([]);
  vegano = input<boolean>(false);
  vegetariano = input<boolean>(false);
  celiaco = input<boolean>(false);
  loading = input<boolean>(false);

  nombresExistentes = input<string[]>([]);
  datosIniciales = input<Partial<PlatoFormData>>({});
  hayCantidadesInvalidas = input<boolean>(false);
  error = input<string | null>(null);
  ocultarPrecios = input<boolean>(false);

  // Outputs
  guardar = output<PlatoFormData>();
  cancelar = output<void>();
  toggleTag = output<'vegano' | 'vegetariano' | 'celiaco'>();

  // Form
  platoForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), (c: any) => this.nombreExisteValidator(c)]],
    costo: [0, [Validators.required, Validators.min(0.01)]],
    precioVenta: [0, [Validators.required, Validators.min(0.01)]],
    tiempoPreparacion: [15, [Validators.required, Validators.min(1)]],
    tipoPlatoId: [null as number | null, [Validators.required]],
    categoriaPlatoId: [null as number | null, [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(8)]]
  });

  private nombreExisteValidator(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const value = control.value.toLowerCase().trim();
    if (this.nombresExistentes().includes(value)) {
      return { nombreExiste: true };
    }
    return null;
  }

  private readonly sincronizarValidadoresPrecios = effect(() => {
    const costoControl = this.platoForm.controls.costo;
    const precioVentaControl = this.platoForm.controls.precioVenta;

    if (this.ocultarPrecios()) {
      costoControl.clearValidators();
      precioVentaControl.clearValidators();
    } else {
      costoControl.setValidators([Validators.required, Validators.min(0.01)]);
      precioVentaControl.setValidators([Validators.required, Validators.min(0.01)]);
    }
    costoControl.updateValueAndValidity({ emitEvent: false });
    precioVentaControl.updateValueAndValidity({ emitEvent: false });
  });

  private readonly sincronizarCostoAutocalculado = effect(() => {
    const costo = this.costoSugerido();
    const costoControl = this.platoForm.controls.costo;

    if (costoControl.value !== costo) {
      costoControl.setValue(costo);
      costoControl.markAsTouched();
    }
  });

  private readonly sincronizarDatosIniciales = effect(() => {
    const datos = this.datosIniciales();
    if (Object.keys(datos).length === 0) return;

    this.platoForm.patchValue({
      nombre: datos.nombre ?? this.platoForm.controls.nombre.value,
      tiempoPreparacion: datos.tiempoPreparacion ?? this.platoForm.controls.tiempoPreparacion.value,
      descripcion: datos.descripcion ?? this.platoForm.controls.descripcion.value
    }, { emitEvent: true });
    this.platoForm.markAsPristine();
  });

  // Signals derivados del form
  private readonly formValue = toSignal(this.platoForm.valueChanges, {
    initialValue: this.platoForm.value
  });

  private readonly formStatus = toSignal(this.platoForm.statusChanges, {
    initialValue: this.platoForm.status
  });

  porcentajeVigente = computed(() => {
    const categoriaId = this.formValue()?.categoriaPlatoId;
    if (categoriaId == null) return 0;
    return this.porcentajesPlatos().find(item => item.id === categoriaId)?.porcentaje ?? 0;
  });

  precioConGanancia = computed<number | null>(() => {
    if (this.formValue()?.categoriaPlatoId == null) return null;
    const costo = this.formValue()?.costo ?? 0;
    return calcularPrecioConGanancia(costo, this.porcentajeVigente());
  });

  private readonly sincronizarPrecioVentaAutocalculado = effect(() => {
    const costo = this.formValue()?.costo ?? 0;
    const precioVentaControl = this.platoForm.controls.precioVenta;

    if (costo <= 0) {
      if (precioVentaControl.value !== 0) {
        precioVentaControl.setValue(0);
      }
      return;
    }

    const precioCalculado = this.precioConGanancia();
    if (precioVentaControl.dirty || precioCalculado == null) return;

    if (precioVentaControl.value !== precioCalculado) {
      precioVentaControl.setValue(precioCalculado);
    }
  });

  precioEsMenorQueCosto = computed(() => {
    const currentVal = this.formValue();
    const pVenta = currentVal?.precioVenta ?? 0;
    const pCosto = currentVal?.costo ?? 0;
    return pVenta > 0 && pCosto > 0 && pVenta <= pCosto;
  });

  tiempoPreparacionLegible = computed(() => {
    const minutos = Number(this.formValue()?.tiempoPreparacion ?? 0);
    if (!Number.isFinite(minutos) || minutos < 60) return '';

    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    return minutosRestantes > 0 ? `${horas} h ${minutosRestantes} min` : `${horas} h`;
  });

  onGuardar(): void {
    if (this.platoForm.invalid || this.hayCantidadesInvalidas()) {
      this.platoForm.markAllAsTouched();
      return;
    }

    const formVal = this.platoForm.value;
    this.guardar.emit({
      nombre: formVal.nombre!,
      costo: formVal.costo!,
      precioVenta: formVal.precioVenta!,
      esPrecioManual: this.platoForm.controls.precioVenta.dirty,
      tiempoPreparacion: formVal.tiempoPreparacion!,
      tipoPlatoId: formVal.tipoPlatoId!,
      categoriaPlatoId: formVal.categoriaPlatoId!,
      descripcion: formVal.descripcion!,
    });
  }

  onToggleTag(tag: 'vegano' | 'vegetariano' | 'celiaco'): void {
    this.toggleTag.emit(tag);
  }
}
