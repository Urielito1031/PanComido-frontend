import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BebidaAEditar } from '../../services/modificar-carta.state';
import { EditarBebidaFormComponent, GuardarBebidaPayload } from '../../../stock-mercaderia/components/editar-bebida-form/editar-bebida-form';

@Component({
  selector: 'app-panel-editar-bebida',
  standalone: true,
  imports: [EditarBebidaFormComponent],
  templateUrl: './panel-editar-bebida.html',
  styleUrls: ['./panel-editar-bebida.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PanelEditarBebidaComponent {
  bebida = input.required<BebidaAEditar>();
  porcentajeGanancia = input<number>(0);
  error = input<string | null>(null);

  guardar = output<GuardarBebidaPayload>();
  cerrar = output<void>();

  onClose(): void {
    this.cerrar.emit();
  }
}
