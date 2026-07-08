import { Component, output, input, signal, ChangeDetectionStrategy, HostListener, ElementRef, inject } from '@angular/core';
import { Plato } from '../../../../../core/models/domain/plato';
import { PorcentajeItem } from '../../../../../core/models/domain/porcentajes-ganancia';
import { ToggleComponent } from '../../../../../shared/ui/toggle/toggle';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';
import { calcularPrecioConGanancia } from '../../../services/plato-cost';
import { esBebida, esBebidaPreparada, categoriaGananciaBebidaPreparada } from '../../services/modificar-carta.rules';

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
  porcentajesBebidas = input<PorcentajeItem[]>([]);
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

    if (esBebidaPreparada(this.plato())) {
      return categoriaGananciaBebidaPreparada(this.plato(), this.porcentajesBebidas());
    }

    const categoriaId = this.categoriaGananciaId();
    if (categoriaId == null) return 0;

    const lista = esBebida(this.plato()) ? this.porcentajesBebidas() : this.porcentajesPlatos();
    return lista.find(item => item.id === categoriaId)?.porcentaje ?? 0;
  }

  obtenerPrecioSugerido(): number | null {
    if (esBebidaPreparada(this.plato())) {
      if (!this.plato().categoria) return null;
      return calcularPrecioConGanancia(this.plato().costo, this.obtenerPorcentajeGanancia());
    }

    if (this.categoriaGananciaId() == null) return null;
    return calcularPrecioConGanancia(this.plato().costo, this.obtenerPorcentajeGanancia());
  }

  private categoriaGananciaId(): number | null | undefined {
    return esBebida(this.plato()) ? this.plato().categoriaInsumoId : this.plato().categoriaPlatoId;
  }
}
