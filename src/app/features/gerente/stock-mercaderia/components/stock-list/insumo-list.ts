import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Insumo } from '../../../../../core/models/domain/insumo';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';

type StockStatus = 'critical' | 'warning' | 'success';

interface StockRow {
  id: number;
  nombre: string;
  categoria: string;
  stock: string;
  minimo: string;
  precioVentaFinal: number;
  vencimiento: string;
  estado: StockStatus;
  estadoLabel: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-insumo-list',
  imports: [ArsCurrencyPipe],
  templateUrl: './insumo-list.html',
  styleUrl: './insumo-list.css',
})
export class InsumoList {
  productos = input.required<Insumo[]>();
  editar = output<number>();
  eliminar = output<number>();

  private readonly dateFormatter = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  filas = computed<StockRow[]>(() => this.productos().map((item) => {
    const estado = this.estado(item);
    const unidad = item.unidadMedida?.nombre ?? '';

    return {
      id: item.id,
      nombre: item.nombre,
      categoria: item.categoriaIngrediente?.descripcion || 'Sin categoría',
      stock: `${item.stockActual} ${unidad}`.trim(),
      minimo: `${item.stockMinimo} ${unidad}`.trim(),
      precioVentaFinal: item.precioVentaFinal ?? 0,
      vencimiento: this.formatearFecha(item.vencimiento),
      estado,
      estadoLabel: this.estadoLabel(estado),
    };
  }));

  trackById = (_: number, fila: StockRow) => fila.id;

  private estado(item: Insumo): StockStatus {
    if (item.stockActual < item.stockMinimo) return 'critical';
    if (item.stockActual < item.stockMinimo * 2) return 'warning';
    return 'success';
  }

  private estadoLabel(estado: StockStatus): string {
    const labels: Record<StockStatus, string> = {
      critical: 'Crítico',
      warning: 'Bajo',
      success: 'Ok',
    };

    return labels[estado];
  }

  private formatearFecha(value: string): string {
    if (!value) return 'Sin fecha';

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : this.dateFormatter.format(date);
  }
}
