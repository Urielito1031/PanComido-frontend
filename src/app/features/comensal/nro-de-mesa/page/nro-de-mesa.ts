import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { Router } from '@angular/router';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-nro-de-mesa',
  standalone: true,
  imports: [Boton, HeaderComensal, BotonComensal],
  templateUrl: './nro-de-mesa.html',
  styleUrls: ['./nro-de-mesa.css']
})
export class NroDeMesa {
  private router = inject(Router);

  configuracionVisualState = inject(ConfiguracionVisualState);

  mesaId: number = 1; //hardcodeado por ahora

  irACantidadPersonas() {
    this.router.navigate(['/comensal/cantidad-personas'], {
      state: { mesaId: this.mesaId }
    });
  }
}
