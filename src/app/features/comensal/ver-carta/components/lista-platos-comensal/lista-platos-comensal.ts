import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CardPlatoComensalComponent } from '../card-plato-comensal/card-plato-comensal';
import { ItemPedido } from '../../../../../core/models/domain/item-pedido';
import { CartaItem } from '../../../../../core/models/domain/carta-item';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-lista-platos-comensal',
  standalone: true,
  imports: [CardPlatoComensalComponent],
  templateUrl: './lista-platos-comensal.html',
  styleUrls: ['./lista-platos-comensal.css'],
})
export class ListaPlatosComensalComponent {

  items = input.required<CartaItem[]>();
  agregarPedido = output<ItemPedido>();

  platos = computed(() =>
    this.items().filter(i => i.esPlato === true)
  );

  bebidas = computed(() =>
    this.items().filter(i => i.esPlato === false)
  );

  onAgregarPedido(item: ItemPedido): void {
    this.agregarPedido.emit(item);
  }
}
