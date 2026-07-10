import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecetaIngrediente } from '../../../../../core/models/domain/plato';
import { BebidaPreparada } from '../../../../../core/models/domain/bebida-preparada';
import { InsumoBebidaDisponible } from '../../../../../core/models/domain/receta';
import { PorcentajeItem } from '../../../../../core/models/domain/porcentajes-ganancia';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { ToggleComponent } from '../../../../../shared/ui/toggle/toggle';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';
import { PriceNoteComponent } from '../../../../../shared/ui/price-note/price-note';
import { RecetaCompactaComponent } from '../../../../../shared/components/receta-compacta/receta-compacta';
import { normalizarUnidadMedida } from '../../../../../shared/utils/unidad-medida.util';
import { calcularCostoReceta, calcularPrecioConGanancia } from '../../../services/plato-cost';

export interface GuardarBebidaPreparadaPayload {
  nombre: string;
  descripcion?: string;
  precioVentaFinal: number;
  esPrecioManual: boolean;
  esVisibleEnCarta: boolean;
  insumos: { insumoId: number; cantidad: number }[];
  imagen?: File;
}

const CATEGORIA_CON_ALCOHOL = 'Con alcohol';
const CATEGORIA_SIN_ALCOHOL = 'Sin alcohol';

@Component({
  selector: 'app-panel-bebida-preparada',
  standalone: true,
  imports: [FormsModule, Boton, ToggleComponent, ArsCurrencyPipe, PriceNoteComponent, RecetaCompactaComponent],
  templateUrl: './panel-bebida-preparada.html',
  styleUrls: ['./panel-bebida-preparada.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PanelBebidaPreparadaComponent {
  bebidaPreparada = input<BebidaPreparada | null>(null);
  insumosDisponibles = input<InsumoBebidaDisponible[]>([]);
  porcentajesBebidas = input<PorcentajeItem[]>([]);
  error = input<string | null>(null);

  guardar = output<GuardarBebidaPreparadaPayload>();
  cerrar = output<void>();

  nombre = signal('');
  descripcion = signal('');
  precioVenta = signal<number | null>(null);
  imagenPreview = signal<string | null>(null);
  archivoImagen = signal<File | null>(null);
  visibleEnCarta = signal<boolean>(true);
  receta = signal<RecetaIngrediente[]>([]);

  esPrecioManualOriginal = signal<boolean>(false);
  precioVentaTocado = signal<boolean>(false);

  costo = computed(() => calcularCostoReceta(this.receta()));

  categoriaCalculada = computed<string | null>(() => {
    if (this.receta().length === 0) return null;

    const idsConAlcohol = new Set(
      this.insumosDisponibles()
        .filter(insumo => insumo.categoria?.trim().toLowerCase() === CATEGORIA_CON_ALCOHOL.toLowerCase())
        .map(insumo => insumo.id)
    );
    const tieneConAlcohol = this.receta().some(item => idsConAlcohol.has(Number(item.id)));
    return tieneConAlcohol ? CATEGORIA_CON_ALCOHOL : CATEGORIA_SIN_ALCOHOL;
  });

  porcentajeVigente = computed(() => {
    const categoria = this.categoriaCalculada();
    if (!categoria) return 0;

    return this.porcentajesBebidas()
      .find(item => item.descripcion?.trim().toLowerCase() === categoria.toLowerCase())
      ?.porcentaje ?? 0;
  });

  precioConGanancia = computed<number | null>(() => {
    if (this.categoriaCalculada() == null || this.costo() <= 0) return null;
    return calcularPrecioConGanancia(this.costo(), this.porcentajeVigente());
  });

  precioEsManual = computed(() => this.esPrecioManualOriginal() || this.precioVentaTocado());

  precioEsMenorQueCosto = computed(() => {
    const venta = this.precioVenta() ?? 0;
    const costoVal = this.costo();
    return venta > 0 && costoVal > 0 && venta <= costoVal;
  });

  hayCantidadesInvalidas = computed(() => this.receta().some(item => !(item.cantidad > 0)));

  puedeGuardar = computed(() => {
    if (!this.nombre().trim()) return false;
    if (this.precioVenta() === null || this.precioVenta()! <= 0) return false;
    if (this.receta().length === 0) return false;
    if (this.hayCantidadesInvalidas()) return false;
    if (!this.bebidaPreparada() && !this.archivoImagen()) return false;
    return true;
  });

  private recetaCargadaPara: BebidaPreparada | null = null;

  constructor() {
    effect(() => {
      const b = this.bebidaPreparada();
      if (!b) return;

      this.nombre.set(b.nombre);
      this.descripcion.set(b.descripcion ?? '');
      this.precioVenta.set(b.precioVentaFinal);
      this.imagenPreview.set(b.urlImagen);
      this.archivoImagen.set(null);
      this.esPrecioManualOriginal.set(b.esPrecioManual);
      this.precioVentaTocado.set(false);
      this.visibleEnCarta.set(b.esVisibleEnCarta);
    });

    effect(() => {
      const b = this.bebidaPreparada();
      if (!b || b === this.recetaCargadaPara) return;

      const disponibles = this.insumosDisponibles();
      if (disponibles.length === 0) return;

      this.receta.set(b.insumos.map(item => {
        const disponible = disponibles.find(d => d.id === item.insumoId);
        return {
          id: item.insumoId,
          nombre: item.nombre,
          cantidad: item.cantidad,
          unidadMedida: normalizarUnidadMedida(disponible?.unidadMedida, true),
          costoUnitario: disponible?.costoUnitario ?? 0,
          opcional: false
        };
      }));
      this.recetaCargadaPara = b;
    });

    // Sigue el precio sugerido mientras no se haya tocado a mano.
    effect(() => {
      const precioCalculado = this.precioConGanancia();
      if (this.precioEsManual() || precioCalculado == null) return;

      if (this.precioVenta() !== precioCalculado) {
        this.precioVenta.set(precioCalculado);
      }
    });
  }

  onRecetaCambiada(ingredientes: RecetaIngrediente[]): void {
    this.receta.set(ingredientes);
  }

  onToggleVisibleEnCarta(): void {
    this.visibleEnCarta.update(v => !v);
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
    const precioCalculado = this.precioConGanancia();
    if (precioCalculado == null) return;

    this.precioVenta.set(precioCalculado);
    this.precioVentaTocado.set(false);
    this.esPrecioManualOriginal.set(false);
  }

  onImagenSeleccionada(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (!archivo) return;

    this.archivoImagen.set(archivo);
    this.imagenPreview.set(URL.createObjectURL(archivo));
  }

  onSave(): void {
    if (!this.puedeGuardar()) return;

    this.guardar.emit({
      nombre: this.nombre(),
      descripcion: this.descripcion() || undefined,
      precioVentaFinal: this.precioVenta()!,
      esPrecioManual: this.precioEsManual(),
      esVisibleEnCarta: this.visibleEnCarta(),
      insumos: this.receta().map(item => ({
        insumoId: Number(item.id),
        cantidad: item.cantidad
      })),
      imagen: this.archivoImagen() ?? undefined
    });
  }

  onClose(): void {
    this.cerrar.emit();
  }
}
