import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MiseAndPlaceListadoDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mise-and-place-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './mise-and-place-card.html',
  styleUrl: './mise-and-place-card.css',
})
export class MiseAndPlaceCard {
  item = input.required<MiseAndPlaceListadoDto>();
  destacado = input<boolean>(false);
}
