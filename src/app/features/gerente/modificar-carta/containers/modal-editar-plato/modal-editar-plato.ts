import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Plato, RecetaIngrediente } from '../../../../../core/models/domain/plato';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { ToggleComponent } from '../../../../../shared/ui/toggle/toggle';
import { Buscador } from '../../../../../shared/ui/buscador/buscador';
import { calcularCostoReceta, calcularPrecioConGanancia } from '../../../services/plato-cost';
import { PlatoApiService, ItemDesplegableDto, IngredienteDisponibleDto } from '../../../services/plato.api';
import { PorcentajeItem } from '../../../../../core/models/domain/porcentajes-ganancia';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';
import { PriceNoteComponent } from '../../../../../shared/ui/price-note/price-note';

@Component({
  selector: 'app-modal-editar-plato',
  standalone: true,
  imports: [FormsModule, Boton, ToggleComponent, Buscador, ArsCurrencyPipe, PriceNoteComponent],
  templateUrl: './modal-editar-plato.html',
  styleUrls: ['./modal-editar-plato.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalEditarPlatoComponent {
  private api = inject(PlatoApiService);
  private destroyRef = inject(DestroyRef);

  plato = input.required<Plato>();
  save = output<Partial<Plato>>();
  close = output<void>();

  nombre = signal('');
  precioVenta = signal<number | null>(null);
  imagen = signal('');
  visible = signal(true);

  descripcion = signal('');
  tiempoPreparacion = signal<number>(15);
  tipoPlatoId = signal<number | null>(null);
  categoriaPlatoId = signal<number | null>(null);
  restriccionesSeleccionadas = signal<number[]>([]);

  tiposPlato = signal<ItemDesplegableDto[]>([]);
  categoriasPlato = signal<ItemDesplegableDto[]>([]);
  restricciones = signal<ItemDesplegableDto[]>([]);
  porcentajesPlatos = signal<PorcentajeItem[]>([]);

  esPrecioManualOriginal = signal<boolean>(false);
  precioVentaTocado = signal<boolean>(false);
  private edicionActiva = signal<boolean>(false);

  vegano = computed(() => this.restriccionesSeleccionadas().includes(1));
  vegetariano = computed(() => this.restriccionesSeleccionadas().includes(2));
  celiaco = computed(() => this.restriccionesSeleccionadas().includes(3));

  receta = signal<RecetaIngrediente[]>([]);
  busqueda = signal<string>('');
  ingredientesDisponibles = signal<IngredienteDisponibleDto[]>([]);

  ingredientesBase = computed(() => this.receta().filter(i => !i.opcional));
  ingredientesOpcionales = computed(() => this.receta().filter(i => i.opcional));

  costo = computed(() => {
    return calcularCostoReceta(this.receta());
  });

  porcentajeVigente = computed(() => {
    const categoriaId = this.categoriaPlatoId();
    if (categoriaId == null) return 0;
    return this.porcentajesPlatos().find(item => item.id === categoriaId)?.porcentaje ?? 0;
  });

  precioConGanancia = computed<number | null>(() => {
    if (this.categoriaPlatoId() == null) return null;
    return calcularPrecioConGanancia(this.costo(), this.porcentajeVigente());
  });

  precioEsManual = computed(() => this.esPrecioManualOriginal() || this.precioVentaTocado());

  precioEsMenorQueCosto = computed(() => {
    const venta = this.precioVenta() ?? 0;
    const costoVal = this.costo() ?? 0;
    return venta > 0 && costoVal > 0 && venta <= costoVal;
  });

  sugerencias = computed(() => {
    const query = this.busqueda().toLowerCase().trim();
    if (!query) return [];

    return this.ingredientesDisponibles().filter(ing =>
      ing.nombre.toLowerCase().includes(query) &&
      !this.receta().some(selected => selected.id === ing.id)
    );
  });

  constructor() {
    this.cargarDatosFormulario();

    effect(() => {
      const p = this.plato();
      if (p) {
        this.nombre.set(p.nombre);
        this.precioVenta.set(p.precioVenta);
        this.imagen.set(p.imagen);
        this.visible.set(p.visible);
        this.descripcion.set(p.descripcion || '');
        this.tiempoPreparacion.set(p.tiempoPreparacion || p.tiempo || 15);
        this.tipoPlatoId.set(p.tipoPlatoId || null);
        this.categoriaPlatoId.set(p.categoriaPlatoId || null);
        this.restriccionesSeleccionadas.set(p.restriccionesIds || []);
        this.esPrecioManualOriginal.set(p.esPrecioManual ?? false);
        this.precioVentaTocado.set(false);
        this.edicionActiva.set(false);

        const receta = p.receta ? JSON.parse(JSON.stringify(p.receta)) as RecetaIngrediente[] : [];
        this.receta.set(receta.map(ingrediente => ({
          ...ingrediente,
          unidadMedida: this.normalizarUnidadMedida(ingrediente.unidadMedida)
        })));
      }
    });

    effect(() => {
      const costoVal = this.costo();
      const precioCalculado = this.precioConGanancia();

      if (!this.edicionActiva() || this.precioEsManual() || costoVal <= 0 || precioCalculado == null) return;

      if (this.precioVenta() !== precioCalculado) {
        this.precioVenta.set(precioCalculado);
      }
    });
  }

  onToggleVisible() {
    this.visible.update(v => !v);
  }

  onSearchChanged(value: string) {
    this.busqueda.set(value);
  }

  cargarDatosFormulario(): void {
    this.api.getDatosFormulario()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.tiposPlato.set(res.tiposPlato);
          this.categoriasPlato.set(res.categoriasPlato);
          this.restricciones.set(res.restricciones);
          this.porcentajesPlatos.set(res.porcentajes.platos);
          this.ingredientesDisponibles.set(res.ingredientes);
        }
      });
  }

  onPrecioVentaChange(value: number | string | null): void {
    this.precioVentaTocado.set(true);
    this.precioVenta.set(value === null || value === '' ? null : +value);
  }

  onRecalcularPrecio(): void {
    const precioCalculado = this.precioConGanancia();
    if (precioCalculado == null) return;

    this.precioVenta.set(precioCalculado);
    this.precioVentaTocado.set(false);
    this.esPrecioManualOriginal.set(false);
  }

  toggleRestriccion(id: number): void {
    const current = this.restriccionesSeleccionadas();
    if (current.includes(id)) {
      this.restriccionesSeleccionadas.set(current.filter(x => x !== id));
    } else {
      this.restriccionesSeleccionadas.set([...current, id]);
    }
  }

  onToggleTag(tag: 'vegano' | 'vegetariano' | 'celiaco'): void {
    const ids = { vegano: 1, vegetariano: 2, celiaco: 3 } as const;
    this.toggleRestriccion(ids[tag]);
  }

  agregarIngrediente(ingrediente: IngredienteDisponibleDto) {
    const nuevo: RecetaIngrediente = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: 0,
      unidadMedida: this.normalizarUnidadMedida(ingrediente.unidadMedida),
      costoUnitario: ingrediente.costoUnitario,
      opcional: false
    };

    this.edicionActiva.set(true);
    this.receta.update(items => [...items, nuevo]);
    this.busqueda.set('');
  }

  eliminarIngrediente(id: string | number) {
    this.edicionActiva.set(true);
    this.receta.update(items => items.filter(item => item.id !== id));
  }

  toggleOpcional(id: string | number) {
    this.edicionActiva.set(true);
    this.receta.update(items => items.map(item => {
      if (item.id === id) {
        return { ...item, opcional: !item.opcional };
      }
      return item;
    }));
  }

  onCantidadCambiada(ing: RecetaIngrediente) {
    this.edicionActiva.set(true);
    const cantidad = Number(ing.cantidad);
    const cantidadValida = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0;
    this.receta.update(items => items.map(item =>
      item.id === ing.id ? { ...item, cantidad: cantidadValida } : item
    ));
  }

  onFocusCantidad(ing: RecetaIngrediente, event: FocusEvent): void {
    if (ing.cantidad === 0) {
      (event.target as HTMLInputElement).value = '';
    }
  }

  onCategoriaChange(value: string | null): void {
    this.edicionActiva.set(true);
    this.categoriaPlatoId.set(value ? +value : null);
  }

  onSave() {
    if (!this.nombre().trim() || this.precioVenta() === null || this.precioVenta()! <= 0 || this.costo() === null || this.costo()! <= 0 || !this.tipoPlatoId() || !this.categoriaPlatoId()) {
      return;
    }
    this.save.emit({
      nombre: this.nombre(),
      precioVenta: this.precioVenta()!,
      costo: this.costo()!,
      esPrecioManual: this.precioEsManual(),
      imagen: this.imagen(),
      visible: this.visible(),
      descripcion: this.descripcion(),
      tiempoPreparacion: this.tiempoPreparacion(),
      tipoPlatoId: this.tipoPlatoId()!,
      categoriaPlatoId: this.categoriaPlatoId()!,
      restriccionesIds: this.restriccionesSeleccionadas(),
      receta: this.receta()
    });
  }

  onClose() {
    this.close.emit();
  }

  private normalizarUnidadMedida(unidad: RecetaIngrediente['unidadMedida']): string {
    const valor = typeof unidad === 'string' ? unidad : unidad?.nombre ?? '';
    const normalizado = valor.trim().toLowerCase();

    if (['kg', 'kilo', 'kilos', 'kilogramo', 'kilogramos'].includes(normalizado)) return 'KG';
    if (['g', 'gr', 'gramo', 'gramos'].includes(normalizado)) return 'GR';
    if (['l', 'lt', 'lts', 'litro', 'litros'].includes(normalizado)) return 'L';
    if (['ml', 'mililitro', 'mililitros'].includes(normalizado)) return 'ML';
    if (['un', 'u', 'unidad', 'unidades'].includes(normalizado)) return 'UN';

    return valor.toUpperCase();
  }
}
