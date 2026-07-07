import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InsumoDetalle } from '../../../../../core/models/domain/insumo';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';
import { PriceNoteComponent } from '../../../../../shared/ui/price-note/price-note';
import { calcularPrecioConGanancia } from '../../../services/plato-cost';

export interface GuardarBebidaPayload {
  nombre: string;
  precioVentaFinal: number;
  esPrecioManual: boolean;
  imagen?: File;
}

@Component({
  selector: 'app-editar-bebida-form',
  standalone: true,
  imports: [FormsModule, Boton, ArsCurrencyPipe, PriceNoteComponent],
  templateUrl: './editar-bebida-form.html',
  styleUrls: ['./editar-bebida-form.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditarBebidaFormComponent {
  insumo = input<InsumoDetalle | null>(null);
  costo = input<number>(0);
  porcentajeGanancia = input<number>(0);

  guardar = output<GuardarBebidaPayload>();
  cancelado = output<void>();

  nombre = signal('');
  precioVenta = signal<number | null>(null);
  imagenPreview = signal<string | null>(null);
  imagenArchivo = signal<File | null>(null);

  esPrecioManualOriginal = signal<boolean>(false);
  precioVentaTocado = signal<boolean>(false);

  precioConGanancia = computed(() => calcularPrecioConGanancia(this.costo(), this.porcentajeGanancia()));

  precioEsManual = computed(() => this.esPrecioManualOriginal() || this.precioVentaTocado());

  precioEsMenorQueCosto = computed(() => {
    const venta = this.precioVenta() ?? 0;
    const costoVal = this.costo();
    return venta > 0 && costoVal > 0 && venta <= costoVal;
  });

  puedeGuardar = computed(() => !!this.nombre().trim() && this.precioVenta() !== null && this.precioVenta()! > 0);

  constructor() {
    effect(() => {
      const detalle = this.insumo();
      if (!detalle) return;

      this.nombre.set(detalle.nombre);
      this.precioVenta.set(detalle.precioVentaFinal ?? null);
      this.imagenPreview.set(detalle.urlImagen);
      this.imagenArchivo.set(null);
      this.esPrecioManualOriginal.set(detalle.esPrecioManual);
      this.precioVentaTocado.set(false);
    });
  }

  onPrecioVentaChange(value: number | string | null): void {
    this.precioVentaTocado.set(true);
    this.precioVenta.set(value === null || value === '' ? null : +value);
  }

  onFocusNumero(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') {
      input.value = '';
    }
  }

  onRecalcularPrecio(): void {
    this.precioVenta.set(this.precioConGanancia());
    this.precioVentaTocado.set(false);
    this.esPrecioManualOriginal.set(false);
  }

  onImagenSeleccionada(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.imagenArchivo.set(archivo);
    this.imagenPreview.set(URL.createObjectURL(archivo));
  }

  onSave(): void {
    if (!this.puedeGuardar()) return;

    this.guardar.emit({
      nombre: this.nombre(),
      precioVentaFinal: this.precioVenta()!,
      esPrecioManual: this.precioEsManual(),
      imagen: this.imagenArchivo() ?? undefined
    });
  }

  onCancelar(): void {
    this.cancelado.emit();
  }
}
