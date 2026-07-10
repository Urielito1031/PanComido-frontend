import { FormsModule } from '@angular/forms';
import { Buscador } from '../../ui/buscador/buscador';
import { RecetaIngrediente } from '../../../core/models/domain/plato';
import { InsumoRecetaDisponible } from '../../../core/models/domain/receta';
import { factorConversionAUnidadBase } from '../../../features/gerente/services/plato-cost';
import { Component, output, signal, computed, input, effect, ChangeDetectionStrategy } from '@angular/core';
import { UnidadMedida } from '../../../core/models/domain/unidad-medida';

interface RecipeQuantityPreset {
  label: string;
  value: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-detalle-receta',
  standalone: true,
  imports: [FormsModule, Buscador],
  templateUrl: './detalle-receta.html',
  styleUrl: './detalle-receta.css'
})
export class DetalleRecetaComponent {
  recetaCambiada = output<RecetaIngrediente[]>();
  ingredientesIniciales = input<RecetaIngrediente[]>([]);
  ingredientesDisponibles = input<InsumoRecetaDisponible[]>([]);

  busqueda = signal<string>('');
  ingredientesSeleccionados = signal<RecetaIngrediente[]>([]);

  private ultimoEmitido: RecetaIngrediente[] | null = null;

  constructor() {
    // La receta inicial puede llegar en dos tandas (ej: el plato "básico" primero
    // y su detalle completo después, de forma asíncrona). Por eso no alcanza con
    // leer `ingredientesIniciales` una sola vez al crear el componente: hay que
    // reaccionar cada vez que cambie, salvo que el cambio sea el eco de lo que
    // este mismo componente acaba de emitir (para no pisar una edición en curso).
    effect(() => {
      const iniciales = this.ingredientesIniciales();
      if (iniciales === this.ultimoEmitido) return;

      this.ingredientesSeleccionados.set(iniciales);
      if (iniciales.length > 0) {
        this.notificarCambio();
      }
    });
  }

  ingredientesBase = computed(() => this.ingredientesSeleccionados().filter(i => !i.opcional));
  ingredientesOpcionales = computed(() => this.ingredientesSeleccionados().filter(i => i.opcional));
  sugerencias = computed(() => {
    const query = this.busqueda().toLowerCase().trim();
    if (!query) return [];

    return this.ingredientesDisponibles().filter(ing =>
      ing.nombre.toLowerCase().includes(query) &&
      !this.ingredientesSeleccionados().some(selected => selected.id === ing.id)
    );
  });

  onSearchChanged(value: string) {
    this.busqueda.set(value);
  }

  agregarIngrediente(ingrediente: InsumoRecetaDisponible) {
    if (this.ingredientesSeleccionados().some(item => item.id === ingrediente.id)) {
      this.busqueda.set('');
      return;
    }

    const nuevo: RecetaIngrediente = {
      id: ingrediente.id,
      nombre: ingrediente.nombre,
      cantidad: 0,
      unidadMedida: ingrediente.unidadMedida,
      costoUnitario: ingrediente.costoUnitario,
      opcional: false
    };

    this.ingredientesSeleccionados.update(items => [...items, nuevo]);
    this.busqueda.set('');
    this.notificarCambio();
  }

  eliminarIngrediente(id: string | number) {
    this.ingredientesSeleccionados.update(items => items.filter(item => item.id !== id));
    this.notificarCambio();
  }

  toggleOpcional(id: string | number) {
    this.ingredientesSeleccionados.update(items => items.map(item => {
      if (item.id === id) {
        return { ...item, opcional: !item.opcional };
      }
      return item;
    }));
    this.notificarCambio();
  }

  onCantidadCambiada(item: RecetaIngrediente) {
    this.actualizarCantidad(item.id, Number(item.cantidad));
  }

  onFocusCantidad(item: RecetaIngrediente, event: FocusEvent): void {
    if (item.cantidad === 0) {
      (event.target as HTMLInputElement).value = '';
    }
  }

  presetsCantidad(item: RecetaIngrediente): RecipeQuantityPreset[] {
    const unidad = this.unidadNormalizada(item.unidadMedida);

    if (['KG', 'KILO', 'KILOS'].includes(unidad)) {
      return [
        { label: '25 g', value: 0.025 },
        { label: '50 g', value: 0.05 },
        { label: '100 g', value: 0.1 },
        { label: '250 g', value: 0.25 },
        { label: '500 g', value: 0.5 }
      ];
    }

    if (['G', 'GR', 'GRAMO', 'GRAMOS'].includes(unidad)) {
      return [
        { label: '10 g', value: 10 },
        { label: '25 g', value: 25 },
        { label: '50 g', value: 50 },
        { label: '100 g', value: 100 },
        { label: '250 g', value: 250 }
      ];
    }

    if (['L', 'LT', 'LITRO', 'LITROS'].includes(unidad)) {
      return [
        { label: '25 ml', value: 0.025 },
        { label: '50 ml', value: 0.05 },
        { label: '100 ml', value: 0.1 },
        { label: '250 ml', value: 0.25 },
        { label: '500 ml', value: 0.5 }
      ];
    }

    if (['ML', 'MILILITRO', 'MILILITROS'].includes(unidad)) {
      return [
        { label: '10 ml', value: 10 },
        { label: '25 ml', value: 25 },
        { label: '50 ml', value: 50 },
        { label: '100 ml', value: 100 },
        { label: '250 ml', value: 250 }
      ];
    }

    if (['UN', 'U', 'UNIDAD', 'UNIDADES', 'PORCION', 'PORCIONES'].includes(unidad)) {
      return [
        { label: '1', value: 1 },
        { label: '2', value: 2 },
        { label: '4', value: 4 },
        { label: '6', value: 6 },
        { label: '8', value: 8 },
        { label: '10', value: 10 }
      ];
    }

    return [];
  }

  aplicarPresetCantidad(item: RecetaIngrediente, preset: RecipeQuantityPreset): void {
    this.actualizarCantidad(item.id, preset.value);
  }

  limpiarCantidad(item: RecetaIngrediente): void {
    this.actualizarCantidad(item.id, 0);
  }

  private actualizarCantidad(id: string | number, cantidad: number): void {
    const cantidadValida = Number.isFinite(cantidad) && cantidad > 0 ? this.redondearCantidad(cantidad) : 0;
    this.ingredientesSeleccionados.update(items => items.map(item =>
      item.id === id ? { ...item, cantidad: cantidadValida } : item
    ));
    this.notificarCambio();
  }

  equivalenciaCantidad(item: RecetaIngrediente): string | null {
    const cantidad = Number(item.cantidad);
    if (!Number.isFinite(cantidad) || cantidad <= 0) return null;

    const unidad = this.unidadNormalizada(item.unidadMedida);
    if (['KG', 'KILO', 'KILOS'].includes(unidad)) {
      return `Equivale a ${this.formatearEquivalencia(cantidad, 'kg', 'g', 1000)}`;
    }

    if (['L', 'LT', 'LITRO', 'LITROS'].includes(unidad)) {
      return `Equivale a ${this.formatearEquivalencia(cantidad, 'l', 'ml', 1000)}`;
    }

    if (['G', 'GR', 'GRAMO', 'GRAMOS'].includes(unidad) && cantidad >= 1000) {
      return `Equivale a ${this.formatearEquivalencia(cantidad / 1000, 'kg', 'g', 1000)}`;
    }

    if (['ML', 'MILILITRO', 'MILILITROS'].includes(unidad) && cantidad >= 1000) {
      return `Equivale a ${this.formatearEquivalencia(cantidad / 1000, 'l', 'ml', 1000)}`;
    }

    return null;
  }

  cantidadPaso(item: RecetaIngrediente): number {
    const unidad = this.unidadNormalizada(item.unidadMedida);
    if (['UN', 'U', 'UNIDAD', 'UNIDADES', 'PORCION', 'PORCIONES'].includes(unidad)) return 1;
    if (['G', 'GR', 'GRAMO', 'GRAMOS', 'ML', 'MILILITRO', 'MILILITROS'].includes(unidad)) return 1;
    return 0.01;
  }

  calcularCostoIngrediente(item: RecetaIngrediente): number {
    const cantidad = Number(item.cantidad) || 0;
    const costoUnitario = Number(item.costoUnitario) || 0;
    const factor = factorConversionAUnidadBase(this.unidadNormalizada(item.unidadMedida));
    return this.redondearCantidad(cantidad * costoUnitario * factor);
  }

  private notificarCambio() {
    const actual = this.ingredientesSeleccionados();
    this.ultimoEmitido = actual;
    this.recetaCambiada.emit(actual);
  }

  private unidadNormalizada(unidad: string | UnidadMedida): string {
    const nombre = typeof unidad === 'string' ? unidad : unidad.nombre;
    return nombre.trim().toUpperCase();
  }

  private redondearCantidad(cantidad: number): number {
    return Math.round(cantidad * 1000) / 1000;
  }

  private formatearEquivalencia(cantidad: number, unidadMayor: string, unidadMenor: string, factor: number): string {
    const enteros = Math.trunc(cantidad);
    const menores = Math.round((cantidad - enteros) * factor);

    if (enteros > 0 && menores > 0) return `${enteros} ${unidadMayor} ${menores} ${unidadMenor}`;
    if (enteros > 0) return `${enteros} ${unidadMayor}`;
    return `${Math.round(cantidad * factor)} ${unidadMenor}`;
  }
}
