import { Component, input, output } from '@angular/core';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';

@Component({
  selector: 'app-modal-eliminar-bodega',
  standalone: true,
  imports: [Boton],
  templateUrl: './modal-eliminar-bodega.html',
  styleUrl: './modal-eliminar-bodega.css'
})
export class ModalEliminarBodegaComponent {
  bodega = input.required<Bodega>();
  errorAPI = input<string | null>(null);
  confirm = output<void>();
  close = output<void>();
}
