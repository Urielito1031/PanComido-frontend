import { DestroyRef, inject, Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { ComandaState } from '../../services/comanda-state';
import { MesaComensalState } from '../../services/mesa-comensal-state';
import { FilaVirtualState } from '../../services/fila-virtual.state';
import { FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cantidad-personas',
  standalone: true,
  imports: [FormsModule, HeaderComensal, BotonComensal],
  templateUrl: './cantidad-personas.html',
  styleUrls: ['./cantidad-personas.css'],
})
export class CantidadPersonas {
  private router = inject(Router);
  private comandaState = inject(ComandaState);
  private destroyRef = inject(DestroyRef);
  private mesaState = inject(MesaComensalState);
  private filaVirtualState = inject(FilaVirtualState);

  cantidadPersonas = 1;
  configuracionVisualState = inject(ConfiguracionVisualState);
  cargando = this.comandaState.cargando;
  
  nombreComensal = this.filaVirtualState.estado()?.nombreCliente || '';
  nombreInvalido = false;

  mesaId = Number(sessionStorage.getItem('mesaId'));
  restauranteId = Number(sessionStorage.getItem('restauranteId'));

  maxCantidad = computed(() => this.mesaState.cantidadMaximaComensales() ?? 6);

  seleccionarCantidad(numero: number) {
    this.cantidadPersonas = numero;
  }

  aceptar() {
    if (!this.nombreComensal.trim()) {
      this.nombreInvalido = true;
      return;
    }
    
    this.nombreInvalido = false;

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
