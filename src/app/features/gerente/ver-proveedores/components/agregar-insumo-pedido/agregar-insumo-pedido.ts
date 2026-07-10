import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { PedidoProveedor } from '../../../../../core/models/domain/proveedor';
import { Insumo } from '../../../../../core/models/domain/insumo';
import { UnidadMedida } from '../../../../../core/models/domain/unidad-medida';
import { VerProveedoresState } from '../../services/ver-proveedores.state';
import { buildSmartQuantityPresets, QuantityPreset } from '../../../../../shared/utils/quantity-presets';

interface InsumoPickerItem {
  id: string;
  producto: Insumo;
  nombre: string;
  stock: string;
  vencimiento: string | null;
}

@Component({
  selector: 'app-agregar-insumo-pedido',
  standalone: true,
  imports: [DatePipe, FontAwesomeModule],
  templateUrl: './agregar-insumo-pedido.html',
  styleUrl: './agregar-insumo-pedido.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgregarInsumoPedidoComponent {
  private readonly state = inject(VerProveedoresState);

  pedido = input.required<PedidoProveedor>();
  cerrar = output<void>();

  faXmark = faXmark;

  busqueda = signal('');
  productoSeleccionadoId = signal('');
  cantidad = signal(1);
  precio = signal<number | null>(null);

  productosParaAgregar = computed<InsumoPickerItem[]>(() => {
    const texto = this.busqueda().toLowerCase().trim();
    const pedido = this.pedido();
    const vistos = new Set<string>();

    return this.state.productos()
      .reduce<InsumoPickerItem[]>((items, producto) => {
        const nombre = producto.nombre?.trim() ?? '';
        const id = producto.id?.toString();
        if (!nombre || !id || vistos.has(id)) return items;
        vistos.add(id);

        if (pedido.items.some(item => item.id.toString() === id)) return items;
        if (texto && !nombre.toLowerCase().includes(texto)) return items;

        items.push({
          id,
          producto,
          nombre,
          stock: `${producto.stockActual} ${this.nombreUnidad(producto.unidadMedida)} disponibles`,
          vencimiento: producto.vencimiento?.trim() || null
        });
        return items;
      }, [])
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  });

  productoSeleccionado(): Insumo | null {
    const id = this.productoSeleccionadoId();
    if (!id) return null;
    return this.state.productos().find(producto => producto.id.toString() === id) ?? null;
  }

  nombreUnidad(unidadMedida: UnidadMedida | string | null | undefined): string {
    if (!unidadMedida) return '';
    return typeof unidadMedida === 'string' ? unidadMedida : unidadMedida.nombre;
  }

  onBusquedaChange(event: Event): void {
    this.busqueda.set((event.target as HTMLInputElement).value);
  }

  seleccionarProducto(producto: Insumo): void {
    this.productoSeleccionadoId.set(producto.id.toString());
    this.busqueda.set(producto.nombre);
    this.cantidad.set(this.getCantidadConfiguracion(producto.unidadMedida).min);
    this.precio.set(this.ultimoPrecioDeInsumo(producto.id));
  }

  get cantidadPaso(): number {
    return this.getCantidadConfiguracion(this.productoSeleccionado()?.unidadMedida ?? 'Kilos').step;
  }

  get cantidadMinima(): number {
    return this.getCantidadConfiguracion(this.productoSeleccionado()?.unidadMedida ?? 'Kilos').min;
  }

  get cantidadPlaceholder(): string {
    return this.getCantidadConfiguracion(this.productoSeleccionado()?.unidadMedida ?? 'Kilos').placeholder;
  }

  onCantidadChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cantidad = Number(input.value);
    if (!Number.isFinite(cantidad)) return;

    const producto = this.productoSeleccionado();
    const unidad = this.nombreUnidad(producto?.unidadMedida).trim().toUpperCase();
    const cantidadNormalizada = ['UN', 'UNIDAD', 'UNIDADES', 'PORCION', 'PORCIONES'].includes(unidad)
      ? Math.max(1, Math.round(cantidad))
      : cantidad;

    this.cantidad.set(cantidadNormalizada);
    input.value = cantidadNormalizada.toString();
  }

  equivalenciaCantidad(): string | null {
    const producto = this.productoSeleccionado();
    if (!producto) return null;
    return this.calcularEquivalencia(this.cantidad(), producto.unidadMedida);
  }

  presetsCantidad(): QuantityPreset[] {
    const producto = this.productoSeleccionado();
    if (!producto) return [];

    const fallback = this.presetsCantidadBase(producto.unidadMedida);
    return buildSmartQuantityPresets(
      this.state.historialProveedor(),
      producto.id,
      this.nombreUnidad(producto.unidadMedida),
      fallback
    );
  }

  sumarCantidadPreset(valor: number): void {
    this.cantidad.update(actual => actual + valor);
  }

  private presetsCantidadBase(unidadMedida: UnidadMedida | string): QuantityPreset[] {
    const unidad = this.nombreUnidad(unidadMedida).trim().toUpperCase();

    if (['KG', 'KILO', 'KILOS'].includes(unidad)) {
      return [
        { label: '100 g', value: 0.1 },
        { label: '500 g', value: 0.5 },
        { label: '1 kg', value: 1 },
        { label: '5 kg', value: 5 },
        { label: '10 kg', value: 10 }
      ];
    }

    if (['GR', 'GRAMO', 'GRAMOS'].includes(unidad)) {
      return [
        { label: '100 gr', value: 100 },
        { label: '500 gr', value: 500 },
        { label: '1 kg', value: 1000 },
        { label: '5 kg', value: 5000 }
      ];
    }

    if (['L', 'LT', 'LITRO', 'LITROS'].includes(unidad)) {
      return [
        { label: '100 ml', value: 0.1 },
        { label: '500 ml', value: 0.5 },
        { label: '1 l', value: 1 },
        { label: '5 l', value: 5 }
      ];
    }

    if (['UN', 'UNIDAD', 'UNIDADES', 'PORCION', 'PORCIONES'].includes(unidad)) {
      return [
        { label: '1', value: 1 },
        { label: '5', value: 5 },
        { label: '10', value: 10 }
      ];
    }

    return [];
  }

  confirmar(): void {
    this.state.agregarIngredienteAPedido(this.pedido(), this.productoSeleccionadoId(), this.cantidad(), this.precio() ?? 0);
    this.cerrar.emit();
  }

  cancelar(): void {
    this.cerrar.emit();
  }

  private ultimoPrecioDeInsumo(insumoId: number | string): number | null {
    const historial = [...this.state.historialProveedor()].sort((a, b) => {
      const fa = new Date(a.fecha).getTime();
      const fb = new Date(b.fecha).getTime();
      return fb - fa;
    });

    for (const pedido of historial) {
      const item = pedido.items.find(i => i.id.toString() === insumoId.toString());
      if (item && item.precioUnitario && item.precioUnitario > 0) {
        return item.precioUnitario;
      }
    }
    return null;
  }

  private getCantidadConfiguracion(unidadMedida: UnidadMedida | string): { step: number; min: number; placeholder: string } {
    const unidad = this.nombreUnidad(unidadMedida).trim().toUpperCase();
    if (['UN', 'UNIDAD', 'UNIDADES', 'PORCION', 'PORCIONES'].includes(unidad)) {
      return { step: 1, min: 1, placeholder: '1' };
    }

    if (['GR', 'GRAMO', 'GRAMOS'].includes(unidad)) {
      return { step: 10, min: 10, placeholder: '100' };
    }

    return { step: 0.1, min: 0.1, placeholder: '0.5' };
  }

  private calcularEquivalencia(cantidad: number, unidadMedida: UnidadMedida | string | null | undefined): string | null {
    if (!cantidad || cantidad <= 0 || Number.isInteger(cantidad)) return null;

    const unidad = this.nombreUnidad(unidadMedida).trim().toUpperCase();
    if (['KG', 'KILO', 'KILOS'].includes(unidad)) {
      return `Equivale a ${this.formatearEquivalencia(cantidad, 'kg', 'g', 1000)}`;
    }

    if (['L', 'LT', 'LITRO', 'LITROS'].includes(unidad)) {
      return `Equivale a ${this.formatearEquivalencia(cantidad, 'l', 'ml', 1000)}`;
    }

    return null;
  }

  private formatearEquivalencia(cantidad: number, unidadMayor: string, unidadMenor: string, factor: number): string {
    const enteros = Math.trunc(cantidad);
    const menores = Math.round((cantidad - enteros) * factor);

    if (enteros > 0 && menores > 0) return `${enteros} ${unidadMayor} ${menores} ${unidadMenor}`;
    if (enteros > 0) return `${enteros} ${unidadMayor}`;
    return `${Math.round(cantidad * factor)} ${unidadMenor}`;
  }
}
