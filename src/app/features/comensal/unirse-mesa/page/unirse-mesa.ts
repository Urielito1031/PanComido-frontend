import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ComandaState } from '../../services/comanda-state';
import { configuracionRestauranteMock } from '../../../../infra/mocks/configuracion-restaurante.mock-data';
import { BotonComensal } from '../../../../shared/ui/botones/boton-comensal/boton-comensal';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-unirse-mesa',
  standalone: true,
  imports: [CommonModule, BotonComensal],
  templateUrl: './unirse-mesa.html',
  styleUrls: ['./unirse-mesa.css']
})
export class UnirseMesa implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private comandaState = inject(ComandaState);
  private cdr = inject(ChangeDetectorRef);

  comandaId!: number;
  datosMesa: any;
  nombre = signal('');

  configuracion = configuracionRestauranteMock;

  ngOnInit(): void {
    console.log('UNIRSE MESA COMPONENT CARGADO');

    this.comandaId = Number(
      this.route.snapshot.paramMap.get('comandaId')
    );

    this.cargarBienvenida();
  }

  cargarBienvenida() {

    this.comandaState.obtenerBienvenidaInvitado(this.comandaId)
      .subscribe({
        next: (res) => {
          this.datosMesa = res;
          this.cdr.detectChanges();
        }
      });

  }

  unirse() {
    if (!this.nombre()) return;

    // guardar sesión del invitado

    sessionStorage.setItem('sesionComensal', JSON.stringify({
      mesa: {
        id: this.datosMesa.idMesa,
        numeroMesa: this.datosMesa.numeroMesa
      },
      idComandaGenerada: this.datosMesa.comandaId,
      restauranteId: this.datosMesa.restauranteId
    }));

    this.comandaState.setComandaDesdeSesion({
      comandaId: this.comandaId,
      restauranteId: this.datosMesa.restauranteId,
      mesaId: this.datosMesa.idMesa
    });
    sessionStorage.setItem('nombreComensal', this.nombre());
    console.log('datosMesa:', this.datosMesa)
    this.router.navigate([
      '/comensal/ver-carta',
      this.datosMesa.restauranteId,
      this.datosMesa.idMesa,
      this.datosMesa.cantComensales
    ]);

  }
}