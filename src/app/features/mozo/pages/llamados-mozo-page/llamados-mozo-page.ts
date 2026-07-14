import {  Component, inject , ChangeDetectionStrategy } from '@angular/core';

import { LlamadoCard } from '../../components/llamado-card/llamado-card';
import { LlamadoState } from '../../services/llamado-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-llamados-mozo-page',
  imports: [LlamadoCard],
  templateUrl: './llamados-mozo-page.html',
  styleUrl: './llamados-mozo-page.css',
})
export class LlamadosMozoPage {
  readonly #state = inject(LlamadoState);

  readonly pendientes = this.#state.llamados;
  readonly cargando = this.#state.cargando;
  readonly error = this.#state.error;
  readonly resolviendoId = this.#state.resolviendoId;
  readonly saliendoId = this.#state.saliendoId;
  readonly hubConectado = this.#state.hubConectado;
  readonly cantidadPendientes = this.#state.cantidadPendientes;
  readonly hayLlamados = this.#state.hayLlamados;

  esNuevo(id: number): boolean {
    return this.#state.esNuevo(id);
  }

  esSaliendo(id: number): boolean {
    return this.#state.saliendoId() === id;
  }

  resolverLlamado(llamadoId: number): void {
    this.#state.resolver(llamadoId);
  }

  reintentar(): void {
    this.#state.reintentar();
  }
}
