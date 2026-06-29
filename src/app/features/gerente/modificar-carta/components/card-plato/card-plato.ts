import { Component, output, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { Plato } from '../../../../../core/models/domain/plato';
import { ToggleComponent } from '../../../../../shared/ui/toggle/toggle';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';
import { PriceNoteComponent } from '../../../../../shared/ui/price-note/price-note';

@Component({
  selector: 'app-card-plato',
  standalone: true,
  imports: [ToggleComponent, ArsCurrencyPipe, PriceNoteComponent],
  templateUrl: './card-plato.html',
  styleUrls: ['./card-plato.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardPlatoComponent {
  
  plato = input.required<Plato>();
  layoutMode = input<'grid' | 'list'>('grid');
  isExploding = input<boolean>(false);
  toggleVisible = output<Plato>();
  editPlato = output<Plato>();
  deletePlato = output<Plato>();
  toggleRecomendado = output<Plato>();
  imgError = signal(false);
  
  onToggle() {
    this.toggleVisible.emit(this.plato());
  }

  onToggleRecomendado() {
    this.toggleRecomendado.emit(this.plato());
  }

  onEdit() {
    this.editPlato.emit(this.plato());
  }

  onDelete() {
    this.deletePlato.emit(this.plato());
  }

  onImgError() {
    this.imgError.set(true);
  }

  obtenerPorcentajeGanancia(): number {
    const precio = this.plato().precioVenta;
    const costo = this.plato().costo;
    if (precio <= 0) return 0;
    return Math.round(((precio - costo) / precio) * 100);
  }
}
