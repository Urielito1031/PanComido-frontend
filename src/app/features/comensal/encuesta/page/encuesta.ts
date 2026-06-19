import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.html',
  styleUrls: ['./encuesta.css']
})
export class Encuesta {

  encuesta = {
    comida: '',
    atencion: '',
    recomendaria: ''
  };

  constructor(private route: ActivatedRoute) {}

restauranteId!: string;
mesaId!: string;
comandaId!: string;

ngOnInit() {
  this.restauranteId = this.route.snapshot.paramMap.get('restauranteId')!;
  this.mesaId = this.route.snapshot.paramMap.get('mesaId')!;
  this.comandaId = this.route.snapshot.paramMap.get('comandaId')!;
}

  enviarEncuesta(): void {

    if (!this.encuesta.comida || !this.encuesta.atencion || !this.encuesta.recomendaria) {
      alert('Por favor completá todas las preguntas.');
      return;
    }

    console.log('Encuesta enviada:', this.encuesta);

    // TODO: llamar servicio backend

    alert('Gracias por tu opinión 🙌');

    this.encuesta = {
      comida: '',
      atencion: '',
      recomendaria: ''
    };
  }
}