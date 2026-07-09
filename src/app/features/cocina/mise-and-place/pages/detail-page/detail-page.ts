import { Component, computed, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-detail-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './detail-page.html',
  styleUrl: './detail-page.css',
})
export class DetailPage implements OnInit {
  state = inject(MiseAndPlaceState);
  private route = inject(ActivatedRoute);

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
