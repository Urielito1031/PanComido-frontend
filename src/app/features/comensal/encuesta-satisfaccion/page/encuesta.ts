import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { EncuestaService } from '../../services/encuesta-satisfaccion/encuesta-service';
import { ComandaState } from '../../services/comanda-state';
import { Router } from '@angular/router';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { BotonComensal } from "../../../../shared/ui/botones/boton-comensal/boton-comensal";
import { EstrellasRating } from "../../../../shared/ui/estrellas-rating/estrellas-rating";

@Component({
  selector: 'app-encuesta',
  imports: [HeaderComensal, BotonComensal, EstrellasRating],
  templateUrl: './encuesta.html',
  styleUrl: './encuesta.css',
})
export class Encuesta {

  readonly #encuestaService = inject(EncuestaService);
  readonly #comandaState = inject(ComandaState);
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly configVisual = inject(ConfiguracionVisualState);
  
  status = signal<'formulario' | 'enviando' | 'exito' | 'error'>('formulario');
  linkResena = signal<string | null>(null);

  puntuacionLugar = signal(0);
  puntuacionComida = signal(0);
  puntuacionMozo = signal(0);

  puedeEnviar = computed(() => 
  this.puntuacionLugar() >= 1 &&
  this.puntuacionComida() >= 1 &&
  this.puntuacionMozo() >= 1);

  enviarEncuesta(): void { 
    const comandaId = this.#comandaState.comandaId();
    if(!comandaId || !this.puedeEnviar()) return;

    this.status.set('enviando');

    this.#encuestaService.enviar(
      comandaId, 
      this.puntuacionLugar(), 
      this.puntuacionComida(), 
      this.puntuacionMozo()
    ).pipe(takeUntilDestroyed(this.#destroyRef))
    .subscribe({
        next: (response) => {
          this.status.set('exito');
          this.linkResena.set(response.linkResenaGoogleMaps);
        },
        error: (error) => {
          console.error('Error al enviar la encuesta:', error);
          this.status.set('error');
        }
      });
  }
  irAlInicio():void { 
    this.#comandaState.limpiarEstado();
    this.#router.navigate(['/comensal/escanear']);
  }
  abrirResena(): void { 
    const link = this.linkResena();
    if(link) 
      window.open(link, '_blank');
  }
}
