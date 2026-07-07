import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Insumo } from '../../../../../core/models/domain/insumo';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';

@Component({
  selector: 'app-modal-eliminar-insumo',
  standalone: true,
  imports: [Boton],
  templateUrl: './modal-eliminar-insumo.html',
  styleUrls: ['./modal-eliminar-insumo.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalEliminarInsumoComponent {
  producto = input.required<Insumo>();
  confirm = output<void>();
  close = output<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onClose() {
    this.close.emit();
  }
}
