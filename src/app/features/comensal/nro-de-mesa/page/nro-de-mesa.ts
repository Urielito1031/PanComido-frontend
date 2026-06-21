import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { Router, ActivatedRoute } from '@angular/router';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { MesaComensalService } from '../../services/mesa-comensal.service';

@Component({
  selector: 'app-nro-de-mesa',
  standalone: true,
  imports: [Boton, HeaderComensal, BotonComensal],
  templateUrl: './nro-de-mesa.html',
  styleUrls: ['./nro-de-mesa.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NroDeMesa implements OnInit {
  private router = inject(Router);
  private mesaService = inject(MesaComensalService);
  private route = inject(ActivatedRoute);

  configuracionVisualState = inject(ConfiguracionVisualState);

  mesaId!: number;
  restauranteId!: number;

  ngOnInit() {
    this.restauranteId = Number(this.route.snapshot.paramMap.get('restauranteId'));
    this.mesaId = Number(this.route.snapshot.paramMap.get('mesaId'));
  }

  irACantidadPersonas() {
    this.router.navigate([ '/comensal/cantidad-personas', ],{
      state: { restauranteId:this.restauranteId, mesaId: this.mesaId}
    });
  }

  volverAtras() {
    this.router.navigate(['/comensal/escanear-mesa']);
  }
}