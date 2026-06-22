import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, Location } from '@angular/common';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { PedidoState } from '../../services/pedido.state';
import { ItemPedido } from '../../../../core/models/domain/item-pedido';
import { LlamarAlMozo } from '../../components/llamar-al-mozo/llamar-al-mozo';
import { ComensalState } from '../../services/comensal-state';
import { ComandaState } from '../../services/comanda-state';
import { PlatoService } from '../../services/plato.service';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { IngredienteOpcional } from '../../../../core/models/dtos/responses/articulo-comensal.response';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-personalizar-plato',
  standalone: true,
  imports: [HeaderComensal, FormsModule, DecimalPipe, LlamarAlMozo, BotonComensal],
  templateUrl: './personalizar-plato.html',
  styleUrls: ['./personalizar-plato.css']
})
export class PersonalizarPlato implements OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private pedidoService = inject(PedidoState);
  private platoService = inject(PlatoService);
  private cdr = inject(ChangeDetectorRef);
  comensalState = inject(ComensalState);
  comandaState = inject(ComandaState);
  configuracionVisualState = inject(ConfiguracionVisualState);

  plato: ItemPedido | null = null;
  itemIndex: number = -1;
  ingredientesOpcionales: IngredienteOpcional[] = [];
  seleccionados: string[] = [];
  observaciones = '';

  ngOnInit() {
    const state = history.state;
    this.plato = state?.plato ?? null;
    this.itemIndex = state?.index ?? -1;

    const platoId = state?.plato?.plato?.id;
    const restauranteId = this.comandaState.restauranteId();

    if (!platoId || !restauranteId) return;

    this.platoService.getArticuloComensal(restauranteId, platoId).subscribe(data => {
      this.ingredientesOpcionales = data.ingredientesOpcionales;
      this.seleccionados = data.ingredientesOpcionales.map(i => i.nombre);

      if (this.plato?.observacionesIngredientes) {
        const removidos = this.plato.observacionesIngredientes
          .split(', ')
          .filter(p => p.startsWith('- '))
          .map(p => p.slice(2));
        this.seleccionados = this.seleccionados.filter(n => !removidos.includes(n));
      }

      this.observaciones = this.plato?.observacionesGenerales ?? '';
      this.cdr.markForCheck();
    });
  }

  toggleIngrediente(nombre: string): void {
    if (this.seleccionados.includes(nombre)) {
      this.seleccionados = this.seleccionados.filter(n => n !== nombre);
    } else {
      this.seleccionados.push(nombre);
    }
  }

  guardarCambios(): void {
    if (!this.plato) return;

    const removidos = this.ingredientesOpcionales
      .map(i => i.nombre)
      .filter(n => !this.seleccionados.includes(n));

    const observacionesIngredientes = removidos.map(r => `- ${r}`).join(', ');

    const itemActualizado: ItemPedido = {
      ...this.plato,
      observacionesIngredientes,
      observacionesGenerales: this.observaciones
    };

    if (this.itemIndex >= 0) {
      this.pedidoService.actualizarItemEnIndice(this.itemIndex, itemActualizado);
    } else {
      this.pedidoService.agregarPedido(itemActualizado);
    }

    this.router.navigate(['/comensal/detalle-pedido']);
  }

  volver(): void {
    this.location.back();
  }
}