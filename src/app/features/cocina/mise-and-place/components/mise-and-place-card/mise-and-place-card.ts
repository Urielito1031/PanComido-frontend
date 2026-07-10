import { Component, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MiseAndPlaceListadoDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mise-and-place-card',
  imports: [DatePipe],
  templateUrl: './mise-and-place-card.html',
  styleUrl: './mise-and-place-card.css',
})
export class MiseAndPlaceCard {
  private router = inject(Router);

  item = input.required<MiseAndPlaceListadoDto>();
  destacado = input<boolean>(false);

  editar = output<MiseAndPlaceListadoDto>();
  eliminar = output<number>();

  confirmando = signal(false);

  navegarAlDetalle(): void {
    this.router.navigate(['/staff/cocina/mise-and-place', this.item().loteId]);
  }

  onEditar(e: MouseEvent): void {
    e.stopPropagation();
    this.editar.emit(this.item());
  }

  onEliminarClick(e: MouseEvent): void {
    e.stopPropagation();
    this.confirmando.set(true);
  }

  confirmarEliminar(e: MouseEvent): void {
    e.stopPropagation();
    this.eliminar.emit(this.item().miseAndPlaceId);
    this.confirmando.set(false);
  }

  cancelarEliminar(e: MouseEvent): void {
    e.stopPropagation();
    this.confirmando.set(false);
  }
}
