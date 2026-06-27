import { Component, input, output, signal , ChangeDetectionStrategy, inject} from '@angular/core';
import { Router } from '@angular/router';
import { ItemPedido } from '../../../../../core/models/domain/item-pedido';
import { CartaItem } from '../../../../../core/models/domain/carta-item';
import { ConfiguracionVisualState } from '../../../services/visual/configuracion-visual-state';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-card-plato-comensal',
  standalone: true,
  imports: [ArsCurrencyPipe],
  templateUrl: './card-plato-comensal.html',
  styleUrls: ['./card-plato-comensal.css'],
})
export class CardPlatoComensalComponent {

  plato = input.required<CartaItem>();
  agregarPedido = output<ItemPedido>();

  configuracionVisualState = inject(ConfiguracionVisualState);
  private router = inject(Router);
  cantidad = signal(1);

  incrementar(): void {
    this.cantidad.update(c => c + 1);
  }

  decrementar(): void {
    if (this.cantidad() > 1) {
      this.cantidad.update(c => c - 1);
    }
  }

  agregar(): void {
    this.agregarPedido.emit({ plato: this.plato(), cantidad: this.cantidad() });
    this.cantidad.set(1);
  }

  imgError = signal(false);

  onImgError(): void {
    this.imgError.set(true);
  }

  verDetalle(): void {
    this.router.navigate(['/comensal/pedido'], {
      state: { plato: this.plato() }
    });
  }
}