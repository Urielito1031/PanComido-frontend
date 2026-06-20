import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Plato } from '../../../../../core/models/domain/plato';

@Component({
  selector: 'app-modal-restaurar-plato',
  standalone: true,
  imports: [],
  templateUrl: './modal-restaurar-plato.html',
  styleUrls: ['./modal-restaurar-plato.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalRestaurarPlatoComponent {
  platos = input.required<Plato[]>();
  loading = input<boolean>(false);

  close = output<void>();
  restaurar = output<Plato>();

  onClose() {
    this.close.emit();
  }

  onRestaurar(plato: Plato) {
    this.restaurar.emit(plato);
  }
}
