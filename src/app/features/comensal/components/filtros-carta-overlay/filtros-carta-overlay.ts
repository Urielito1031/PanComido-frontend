import { Component, output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CartaState } from '../../ver-carta/service/carta-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-filtros-carta-overlay',
  standalone: true,
  templateUrl: './filtros-carta-overlay.html',
  styleUrls: ['./filtros-carta-overlay.css'],
})
export class FiltrosCartaOverlay {
  cartaState = inject(CartaState);
  configuracionVisualState = inject(ConfiguracionVisualState);
  cerrar = output<void>();
  toggleTipo = output<string>();
  limpiar = output<void>();

  seccionPlatosAbierta = signal(true);
  seccionBebidasAbierta = signal(true);
  seccionRestriccionesAbierta = signal(true);

  toggleSeccion(seccion: 'platos' | 'bebidas' | 'restricciones'): void {
    if (seccion === 'platos') this.seccionPlatosAbierta.update(v => !v);
    if (seccion === 'bebidas') this.seccionBebidasAbierta.update(v => !v);
    if (seccion === 'restricciones') this.seccionRestriccionesAbierta.update(v => !v);
  }

  aplicarFiltros(): void {
    this.cerrar.emit();
  }

  limpiarFiltros(): void {
  this.limpiar.emit();
}
}