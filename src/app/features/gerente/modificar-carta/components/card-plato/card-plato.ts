import { Component, output, input, signal, ChangeDetectionStrategy, HostListener, ElementRef, inject } from '@angular/core';
import { Plato } from '../../../../../core/models/domain/plato';
import { PorcentajeItem } from '../../../../../core/models/domain/porcentajes-ganancia';
import { ToggleComponent } from '../../../../../shared/ui/toggle/toggle';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';

@Component({
  selector: 'app-card-plato',
  standalone: true,
  imports: [ToggleComponent, ArsCurrencyPipe],
  templateUrl: './card-plato.html',
  styleUrls: ['./card-plato.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardPlatoComponent {
  
  private elRef = inject(ElementRef);

  plato = input.required<Plato>();
  porcentajesPlatos = input<PorcentajeItem[]>([]);
  layoutMode = input<'grid' | 'list'>('grid');
  isExploding = input<boolean>(false);
  toggleVisible = output<Plato>();
  editPlato = output<Plato>();
  deletePlato = output<Plato>();
  toggleRecomendado = output<Plato>();
  imgError = signal(false);
  isMenuOpen = signal(false);
  
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

  toggleMenu(event: Event) {
    event.stopPropagation();
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isMenuOpen() && !this.elRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  obtenerPorcentajeGanancia(): number {
    // Cálculo anterior (margen realizado sobre el precio de venta, NO es lo mismo
    // que el % de ganancia configurado por categoría):
    // const precio = this.plato().precioVenta;
    // const costo = this.plato().costo;
    // if (precio <= 0) return 0;
    // return Math.round(((precio - costo) / precio) * 100);

    const categoriaId = this.plato().categoriaPlatoId;
    if (categoriaId == null) return 0;
    return this.porcentajesPlatos().find(item => item.id === categoriaId)?.porcentaje ?? 0;
  }
}
