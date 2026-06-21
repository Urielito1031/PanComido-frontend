import { DestroyRef, inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { ComandaState } from '../../services/comanda-state';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-cantidad-personas',
  standalone: true,
  imports: [
    FormsModule,
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
  private route = inject(ActivatedRoute);

  cantidadPersonas = 1;
  maxCantidad = 5;
  configuracionVisualState = inject(ConfiguracionVisualState);
  cargando = this.comandaState.cargando;
  nombreComensal = '';

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

  if (!this.nombreComensal.trim()) {
    alert('Ingresá tu nombre');
    return;
  }

  console.log('route params:', this.route.snapshot.paramMap.keys);
  console.log('restauranteId:', this.route.snapshot.paramMap.get('restauranteId'));
  console.log('mesaId:', this.route.snapshot.paramMap.get('mesaId'));

  const restauranteId = history.state?.restauranteId;
  const mesaId = this.mesaId;

  this.comandaState.ocuparMesa(restauranteId, mesaId, this.cantidadPersonas, this.nombreComensal)
  .pipe(takeUntilDestroyed(this.destroyRef))
 .subscribe({
 next: (res: any) => {
  if (!res || !res.idComandaGenerada) {
    console.error('Respuesta inválida del backend', res);
    return;
  }

    sessionStorage.setItem('nombreComensal', this.nombreComensal);

  sessionStorage.setItem('sesionComensal', JSON.stringify(res));


 this.router.navigate(['/comensal/ver-carta'], {
  state: { restauranteId, mesaId, cantidadPersonas: this.cantidadPersonas }
});
},
  error: (err) => {

    console.error('Status:', err.status);
    console.error('Error body:', err.error);
    console.error('Error completo:', err);

    if (err.status === 409) {
      console.warn('Mesa ocupada, intentando recuperar sesión...');

      const sesion = sessionStorage.getItem('sesionComensal');

      if (sesion && sesion !== 'undefined') {
        const parsed = JSON.parse(sesion);

       this.router.navigate(['/comensal/ver-carta'], {
         state: { restauranteId, mesaId, cantidadPersonas: this.cantidadPersonas },
       });
        return;
      }

      alert('Mesa ocupada pero no hay sesión válida');
    }
  }
});

}
volverAtras() {
  const restauranteId = Number(this.route.snapshot.paramMap.get('restauranteId'));
  const mesaId = Number(this.route.snapshot.paramMap.get('mesaId'));

  console.log('VOLVER -> restauranteId:', restauranteId);
  console.log('VOLVER -> mesaId:', mesaId);

  this.router.navigate(['comensal/mesa', restauranteId, mesaId]);
}

}
