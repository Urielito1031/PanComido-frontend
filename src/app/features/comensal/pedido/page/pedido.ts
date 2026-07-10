import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { PedidoState } from '../../services/pedido.state';
import { CartaItem } from '../../../../core/models/domain/carta-item';
import { ComandaState } from '../../services/comanda-state';
import { ComensalState } from '../../services/comensal-state';
import { PlatoService } from '../../services/plato.service';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { LlamarAlMozo } from '../../components/llamar-al-mozo/llamar-al-mozo';
import { ArticuloComensalResponse } from '../../../../core/models/dtos/responses/articulo-comensal.response';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-pedido',
  standalone: true,
  imports: [HeaderComensal, BotonComensal, DecimalPipe, LlamarAlMozo],
  templateUrl: './pedido.html',
  styleUrl: './pedido.css'
})
export class Pedido implements OnInit {
  private router = inject(Router);
  private pedidoService = inject(PedidoState);
  private platoService = inject(PlatoService);
  private cdr = inject(ChangeDetectorRef);
  comandaState = inject(ComandaState);
  comensalState = inject(ComensalState);
  configuracionVisualState = inject(ConfiguracionVisualState);

  plato: CartaItem | null = null;
  detalle: ArticuloComensalResponse | null = null;
  cantidad = signal(1);

  ngOnInit(): void {
    this.plato = history.state?.plato ?? null;

    const id = this.plato?.id;
    const restauranteId = this.comandaState.restauranteId();

    if (!id || !restauranteId) return;

    this.platoService.getArticuloComensal(restauranteId, id).subscribe(data => {
      this.detalle = data;
      this.cdr.markForCheck();
    });
  }

  agregarAlPedido(): void {
    if (!this.plato) return;
    this.pedidoService.agregarPedido({ plato: this.plato, cantidad: this.cantidad() });
    this.router.navigate(['/comensal/detalle-pedido']);
  }

  irAPersonalizar(): void {
    if (!this.plato) return;
    this.router.navigate(['/comensal/personalizar-plato'], {
      state: { plato: { plato: this.plato, cantidad: this.cantidad() } }
    });
  }

  incrementar(): void {
    this.cantidad.update(c => c + 1);
  }

  decrementar(): void {
    if (this.cantidad() > 1) this.cantidad.update(c => c - 1);
  }
}