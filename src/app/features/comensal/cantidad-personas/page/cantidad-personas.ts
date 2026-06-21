import { DestroyRef, inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { ComandaState } from '../../services/comanda-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cantidad-personas',
  standalone: true,
  imports: [
    Boton,
    HeaderComensal,
    BotonComensal
  ],
  templateUrl: './cantidad-personas.html',
  styleUrls: ['./cantidad-personas.css']
})
export class CantidadPersonas {
  private router = inject(Router);
  private comandaState = inject(ComandaState);
  private destroyRef = inject(DestroyRef);

  cantidadPersonas = 1;
  maxCantidad = 5;
  configuracionVisualState = inject(ConfiguracionVisualState);
  cargando = this.comandaState.cargando;

  // Viene del paso anterior (nro-de-mesa)
  mesaId: number = history.state?.mesaId ?? 1;

  expandirOpciones() {
    if (this.maxCantidad < 10) {
      this.maxCantidad = 10;
    }
  }

  seleccionarCantidad(numero: number) {
    this.cantidadPersonas = numero;
  }

  aceptar() {
    const restauranteId = history.state?.restauranteId ?? 1;
    this.comandaState.ocuparMesa(this.mesaId, this.cantidadPersonas, restauranteId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.router.navigate(['/comensal/ver-carta'], {
          state: { mesaId: this.mesaId, cantidadPersonas: this.cantidadPersonas, restauranteId }
        });
      });
  }


}
