import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { MiseAndPlaceForm } from '../mise-and-place-form/mise-and-place-form';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { MiseAndPlaceListadoDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

@Component({
  selector: 'app-mise-and-place-offcanvas',
  imports: [MiseAndPlaceForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mise-and-place-offcanvas.html',
  styleUrl: './mise-and-place-offcanvas.css',
})
export class MiseAndPlaceOffcanvas {
  state = inject(MiseAndPlaceState);

  item = input.required<MiseAndPlaceListadoDto>();

  cerrado = output<void>();

  guardando = signal(false);
  errorGuardar = signal<string | null>(null);

  onGuardar(dto: CrearMiseAndPlaceDto): void {
    const actual = this.item();
    this.errorGuardar.set(null);
    this.guardando.set(true);

    this.state.modificar(actual.miseAndPlaceId, dto, (error) => {
      if (error) {
        this.errorGuardar.set(error);
        this.guardando.set(false);
      } else {
        this.onClose();
      }
    });
  }

  onClose(): void {
    this.cerrado.emit();
  }
}
