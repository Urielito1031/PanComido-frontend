import { Component, output, signal, computed, input, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Buscador } from '../../ui/buscador/buscador';
import { RecetaIngrediente } from '../../../core/models/domain/plato';
import { InsumoRecetaDisponible } from '../../../core/models/domain/receta';
import { normalizarUnidadMedida } from '../../utils/unidad-medida.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-receta-compacta',
  standalone: true,
  imports: [FormsModule, Buscador],
  templateUrl: './receta-compacta.html',
  styleUrl: './receta-compacta.css'
})
export class RecetaCompactaComponent {
  recetaCambiada = output<RecetaIngrediente[]>();
  ingredientesIniciales = input<RecetaIngrediente[]>([]);
  ingredientesDisponibles = input<InsumoRecetaDisponible[]>([]);
  permitirOpcional = input<boolean>(true);
  preferirUnidadesPequenas = input<boolean>(false);

  busqueda = signal<string>('');
  ingredientesSeleccionados = signal<RecetaIngrediente[]>([]);

  private ultimoEmitido: RecetaIngrediente[] | null = null;

  constructor() {
    // La receta inicial puede llegar en dos tandas (detalle asíncrono después
    // del básico), por eso reacciona a cada cambio salvo que sea el eco de su
    // propia última emisión.
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
      unidadMedida: normalizarUnidadMedida(ingrediente.unidadMedida, this.preferirUnidadesPequenas()),
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
    this.ingredientesSeleccionados.update(items => items.map(item =>
      item.id === id ? { ...item, opcional: !item.opcional } : item
    ));
    this.notificarCambio();
  }

  onCantidadCambiada(ing: RecetaIngrediente) {
    const cantidad = Number(ing.cantidad);
    const cantidadValida = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 0;
    this.ingredientesSeleccionados.update(items => items.map(item =>
      item.id === ing.id ? { ...item, cantidad: cantidadValida } : item
    ));
    this.notificarCambio();
  }

  onFocusCantidad(ing: RecetaIngrediente, event: FocusEvent): void {
    if (ing.cantidad === 0) {
      (event.target as HTMLInputElement).value = '';
    }
  }

  private notificarCambio() {
    const actual = this.ingredientesSeleccionados();
    this.ultimoEmitido = actual;
    this.recetaCambiada.emit(actual);
  }
}
