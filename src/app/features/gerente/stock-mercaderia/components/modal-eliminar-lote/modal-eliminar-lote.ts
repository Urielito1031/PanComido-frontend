import { Component, input, output } from '@angular/core';
import { LoteInsumo } from '../../../../../core/models/domain/insumo';

@Component({
  selector: 'app-modal-eliminar-lote',
  standalone: true,
  templateUrl: './modal-eliminar-lote.html',
  styleUrl: './modal-eliminar-lote.css'
})
export class ModalEliminarLoteComponent {
  lote = input.required<LoteInsumo>();
  insumoNombre = input<string>('');
  errorAPI = input<string | null>(null);
  eliminando = input<boolean>(false);

  confirm = output<void>();
  close = output<void>();
}

