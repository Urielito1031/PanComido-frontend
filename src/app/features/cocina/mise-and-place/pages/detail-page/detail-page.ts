import { Component, computed, inject } from '@angular/core';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-detail-page',
  imports: [],
  templateUrl: './detail-page.html',
  styleUrl: './detail-page.css',
})
export class DetailPage {
  state = inject(MiseAndPlaceState);
  route = inject(ActivatedRoute);

  item = computed(() => 
    this.state.items().find(
      i => i.loteId === Number(this.route.snapshot.paramMap.get('loteId'))
    )
  );
  cargando = this.state.cargando;
  error = this.state.error;


  ngOnInit(): void {
    this.state.cargarListado();
  }
}
