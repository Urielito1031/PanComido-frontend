import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MesaComensalService } from '../../services/mesa-comensal.service';
import { configuracionRestauranteMock } from '../../../../infra/mocks/configuracion-restaurante.mock-data';
import { Boton } from '../../../../shared/ui/botones/boton/boton';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';

import { HeaderNroDeMesa } from '../components/header-nro-de-mesa/header-nro-de-mesa';


@Component({
  selector: 'app-nro-de-mesa',
  standalone: true,
  imports: [CommonModule, Boton, HeaderNroDeMesa, BotonComensal],
  templateUrl: './nro-de-mesa.html',
  styleUrls: ['./nro-de-mesa.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NroDeMesa implements OnInit {
  private router = inject(Router);
  private mesaService = inject(MesaComensalService);
  private route = inject(ActivatedRoute);


  mesaId!: number;
  restauranteId!: number;
configuracion = configuracionRestauranteMock;
  


ngOnInit() {
 console.log('ENTRÉ A MESA OK');
  this.restauranteId = Number(
    this.route.snapshot.paramMap.get('restauranteId')
  );

  this.mesaId = Number(
    this.route.snapshot.paramMap.get('mesaId')
  );

  this.cargarBienvenida();
}

cargarBienvenida() {
  this.mesaService
    .obtenerBienvenida(this.mesaId, this.restauranteId)
    .subscribe({
      next: (res) => {
  this.configuracion = res ?? configuracionRestauranteMock;
},
      error: (err) => {
        console.error(err);
      }
    });
}


  irACantidadPersonas() {
  this.router.navigate([
    '/comensal/cantidad-personas',
    this.restauranteId,
    this.mesaId
  ]);
}

  volverAtras() {
    this.router.navigate(['/comensal/escanear-mesa']);
  }
}