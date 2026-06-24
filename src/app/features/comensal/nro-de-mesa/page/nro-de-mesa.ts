import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { Router, ActivatedRoute } from '@angular/router';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { MesaComensalState } from '../../services/mesa-comensal-state';

@Component({
  selector: 'app-nro-de-mesa',
  standalone: true,
  imports: [HeaderComensal, BotonComensal],
  templateUrl: './nro-de-mesa.html',
  styleUrls: ['./nro-de-mesa.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NroDeMesa implements OnInit {
  mesaState = inject(MesaComensalState);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  configuracionVisualState = inject(ConfiguracionVisualState);


  ngOnInit() {
    const restauranteId = Number(this.route.snapshot.paramMap.get('restauranteId'));
    const mesaId = Number(this.route.snapshot.paramMap.get('mesaId'));

    sessionStorage.setItem('restauranteId', restauranteId.toString());
    sessionStorage.setItem('mesaId', mesaId.toString());
    
    this.mesaState.cargarBienvenida(mesaId, restauranteId);
  }

  irACantidadPersonas() {
    this.router.navigate(['/comensal/cantidad-personas']);
  }

  volverAtras() {
    this.router.navigate(['/comensal/escanear-mesa']);
  }
}
