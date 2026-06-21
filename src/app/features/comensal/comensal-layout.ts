import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfiguracionVisualState } from './services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comensal-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class ComensalLayout implements OnInit {
  private configVisualState = inject(ConfiguracionVisualState);

  ngOnInit(): void {
    const restauranteId = history.state?.restauranteId ?? 1;
    this.configVisualState.cargar(restauranteId);
  }
}
