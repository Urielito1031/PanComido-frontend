import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { MesaComensalState } from '../../services/mesa-comensal-state';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';

@Component({
  selector: 'app-unirse-mesa',
  standalone: true,
  imports: [CommonModule, BotonComensal],
  templateUrl: './unirse-mesa.html',
  styleUrls: ['./unirse-mesa.css'],
})
export class UnirseMesa implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  private comandaState = inject(ComandaState);
  mesaComensalState = inject(MesaComensalState);
  configuracionVisualState = inject(ConfiguracionVisualState);

  comandaId!: number;
  datosMesa: any;
  nombre = signal('');


  ngOnInit(): void {

    this.comandaId = Number(this.route.snapshot.paramMap.get('comandaId'));
    this.mesaComensalState.cargarBienvenidaInvitado(this.comandaId);
  }

  unirse() {
    if (!this.nombre()) return;

    const data = this.mesaComensalState.bienvenidaInvitado();
    if (!data) return;

    sessionStorage.setItem(
      'sesionComensal', JSON.stringify({
        mesa: {
          id: data.idMesa,
          numeroMesa: data.numeroMesa,
        },
        comandaId: data.comandaId,
        restauranteId: data.restauranteId,
      }),
    );
    this.comandaState.setComandaDesdeSesion({
      comandaId: data.comandaId,
      restauranteId: data.restauranteId,
      mesaId: data.idMesa,
    });

    sessionStorage.setItem('nombreComensal', this.nombre());
    sessionStorage.setItem('restauranteId', String(data.restauranteId));
    sessionStorage.setItem('mesaId', String(data.idMesa));
    sessionStorage.setItem('cantidadPersonas', String(data.cantComensales));

    this.router.navigate(['/comensal/ver-carta']);
  }
}
