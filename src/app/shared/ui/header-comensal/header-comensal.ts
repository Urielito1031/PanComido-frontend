import { Component, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { ConfiguracionVisualState } from '../../../features/comensal/services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header-comensal',
  standalone: true,
  templateUrl: './header-comensal.html',
  styleUrls: ['./header-comensal.css'],
})
export class HeaderComensal {
  private router = inject(Router);
  configuracionVisualState = inject(ConfiguracionVisualState);

  /** Muestra la flecha de volver atrás */
  showBack = input(false);
  /** Ruta de navegación al hacer clic en back. Si no se define, emite el evento back. */
  backRoute = input<string | null>(null);
  /** Muestra el botón de cerrar (✕) */
  showClose = input(false);
  /** Título opcional centrado */
  title = input<string>('');

  /** Se emite cuando se hace clic en back y no hay backRoute */
  back = output<void>();
  /** Se emite cuando se hace clic en cerrar */
  close = output<void>();

  onBack(): void {
    const route = this.backRoute();
    if (route) {
      this.router.navigate([route]);
    } else {
      this.back.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}
