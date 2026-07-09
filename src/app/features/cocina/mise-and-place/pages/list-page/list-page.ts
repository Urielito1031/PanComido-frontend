import { Component, inject, signal } from '@angular/core';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { MiseAndPlaceForm } from "../../components/mise-and-place-form/mise-and-place-form";
import { MiseAndPlaceCard } from "../../components/mise-and-place-card/mise-and-place-card";

@Component({
  selector: 'app-list-page',
  imports: [MiseAndPlaceForm, MiseAndPlaceCard],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
})
export class ListPage {
   state = inject(MiseAndPlaceState);

  mostrarModal = signal(false);

  ngOnInit():void{
    this.state.cargarListado();
  }

  abrirModal():void{
    this.state.cargarFormData();
    this.mostrarModal.set(true);
  }

  cerrarModal():void{
    this.mostrarModal.set(false);
  }
  onGuardar(dto:CrearMiseAndPlaceDto):void{
    this.state.crear(dto);
    this.mostrarModal.set(false);
  }

}
