import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';

@Component({
  selector: 'app-estrellas-rating',
  imports: [],
   changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './estrellas-rating.html',
  styleUrl: './estrellas-rating.css',
})
export class EstrellasRating {
  valor = model.required<number>();
  maximo = input(5);
  soloLectura = input(false);

  readonly #hover = signal(0);

  prevista = computed(() => this.#hover() || this.valor());

  readonly estrellas = [1,2,3,4,5];
  
  setHover(estrella:number): void{
    if(!this.soloLectura()) 
      this.#hover.set(estrella);
  }
  clearHover(): void{
    this.#hover.set(0);
  }
  seleccionar(estrella:number): void{ 
    if(!this.soloLectura())
      this.valor.set(estrella);
  }


}
