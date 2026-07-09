import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LlamarAlMozo } from '../llamar-al-mozo/llamar-al-mozo';
import { FilaVirtualState } from '../../services/fila-virtual.state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comensal-footer-cart',
  standalone: true,
  imports: [CommonModule, LlamarAlMozo],
  templateUrl: './comensal-footer-cart.html',
  styleUrls: ['./comensal-footer-cart.css']
})
export class ComensalFooterCart {
  filaVirtualState = inject(FilaVirtualState);
  cantidadItems = input.required<number>();
  total = input.required<number>();
  mesaId = input.required<number>();
  enviando = input<boolean>(false);
  enviado = input<boolean>(false);
  error = input<string | null>(null);

  configuracionVisualState = inject(ConfiguracionVisualState);
  
  verPedido = output<void>();
  llamadoMozo = output<any>();
  modalCerrado = output<void>();
}