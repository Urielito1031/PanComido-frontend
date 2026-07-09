import { Component, inject, signal, OnInit } from '@angular/core';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { CrearMiseAndPlaceDto } from '../../../../../core/models/dtos/requests/mise-and-place.request';
import { MiseAndPlaceForm } from '../../components/mise-and-place-form/mise-and-place-form';
import { MiseAndPlaceCard } from '../../components/mise-and-place-card/mise-and-place-card';
import { MiseAndPlaceListadoDto } from '../../../../../core/models/dtos/responses/mise-and-place.response';

@Component({
  selector: 'app-list-page',
  imports: [MiseAndPlaceForm, MiseAndPlaceCard],
  templateUrl: './list-page.html',
  styleUrl: './list-page.css',
})
export class ListPage implements OnInit {
  state = inject(MiseAndPlaceState);

  mostrarModal = signal(false);
  editandoItem = signal<MiseAndPlaceListadoDto | null>(null);

  ngOnInit(): void {
    this.state.cargarListado();
  }

  abrirModal(): void {
    this.editandoItem.set(null);
    this.state.cargarFormData();
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
    this.editandoItem.set(null);
  }

  onEditar(item: MiseAndPlaceListadoDto): void {
    this.editandoItem.set(item);
    this.state.cargarFormData();
    this.mostrarModal.set(true);
  }

  onEliminar(id: number): void {
    this.state.eliminar(id);
  }

  onGuardar(dto: CrearMiseAndPlaceDto): void {
    const editando = this.editandoItem();
    if (editando) {
      this.state.modificar(editando.miseAndPlaceId, { ...dto, loteId: editando.loteId });
    } else {
      this.state.crear(dto);
    }
    this.cerrarModal();
  }
}
