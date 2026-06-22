import { DestroyRef, inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { ComandaState } from '../../services/comanda-state';
import { FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cantidad-personas',
  standalone: true,
  imports: [FormsModule, Boton, HeaderComensal, BotonComensal],
  templateUrl: './cantidad-personas.html',
  styleUrls: ['./cantidad-personas.css'],
})
export class CantidadPersonas {
  private router = inject(Router);
  private comandaState = inject(ComandaState);
  private destroyRef = inject(DestroyRef);

  cantidadPersonas = 1;
  maxCantidad = 5;
  configuracionVisualState = inject(ConfiguracionVisualState);
  cargando = this.comandaState.cargando;
  nombreComensal = '';

  mesaId = Number(sessionStorage.getItem('mesaId'));
  restauranteId = Number(sessionStorage.getItem('restauranteId'));

  expandirOpciones() {
    if (this.maxCantidad < 10) {
      this.maxCantidad = 10;
    }
  }

  seleccionarCantidad(numero: number) {
    this.cantidadPersonas = numero;
  }

  aceptar() {
    if (!this.nombreComensal.trim()) {
      alert('Ingresá tu nombre');
      return;
    }

    this.comandaState
      .ocuparMesa(this.restauranteId, this.mesaId, this.cantidadPersonas, this.nombreComensal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (!res || !res.idComandaGenerada) {
            console.error('Respuesta inválida del backend', res);
            return;
          }

          sessionStorage.setItem('nombreComensal', this.nombreComensal);
          sessionStorage.setItem('sesionComensal', JSON.stringify(res));
          sessionStorage.setItem('cantidadPersonas', String(this.cantidadPersonas));

          this.router.navigate(['/comensal/ver-carta']);
        },
        error: (err) => {
          console.error('Error completo:', err);

          if (err.status === 409) {
            const sesion = sessionStorage.getItem('sesionComensal');

            if (sesion && sesion !== 'undefined') {
              this.router.navigate(['/comensal/ver-carta']);
              return;
            }

            alert('Mesa ocupada pero no hay sesión válida');
          }
        },
      });
  }

  volverAtras() {
    this.router.navigate(['comensal/mesa', this.restauranteId, this.mesaId]);
  }
}
