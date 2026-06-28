import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ItemEstadoPedido } from '../../../../core/models/domain/comanda';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resumen-pedido',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './resumen-pedido.html',
  styleUrls: ['./resumen-pedido.css']
})
export class ResumenPedido {
  items = input.required<ItemEstadoPedido[]>();
  estadoUI = input.required<string>();
  mesaId = input<number | null>(null);

  get iconoEstado(): string {
    const ui = this.estadoUI();
    if (ui === 'Preparación') return 'restaurant';
    if (ui === 'Listo') return 'room_service';
    return 'skillet';
  }

  private agrupar(lista: ItemEstadoPedido[]) {
    const grupos = new Map<string, ItemEstadoPedido[]>();
    for (const item of lista) {
      const nombre = item.nombreComensal || 'Sin nombre';
      if (!grupos.has(nombre)) grupos.set(nombre, []);
      grupos.get(nombre)!.push(item);
    }
    return Array.from(grupos.entries()).map(([nombre, items]) => ({ nombre, items }));
  }

  itemsAgrupados = computed(() => this.agrupar(this.items().filter(i => !i.entregado)));
  itemsEntregados = computed(() => this.agrupar(this.items().filter(i => i.entregado)));
  cantidadEntregados = computed(() => this.items().filter(i => i.entregado).length);
}
