import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { UnidadNormalizadaPipe } from '../../../../../shared/pipes/unidad-normalizada.pipe';
import { MiseAndPlaceState } from '../../services/mise-and-place-state';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-detail-page',
  imports: [DatePipe, DecimalPipe, RouterLink, UnidadNormalizadaPipe],
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
    this.state.cargarFormData();
  }

  maxPorcentaje = computed(() => {
    const ing = this.item()?.receta;
    if (!ing || ing.length === 0) return null;
    return Math.max(...ing.map(i => i.cantidad));
  });

  costoTotalReceta = computed(() => {
    const ing = this.item()?.receta;
    if (!ing || ing.length === 0) return null;
    const total = ing.reduce((sum, i) => sum + (i.cantidad * i.costoUnitario), 0);
    return total > 0 ? Math.round(total * 100) / 100 : null;
  });

  estadoVenc(fecha: string): string {
    const hoy = new Date();
    const ven = new Date(fecha);
    const diff = Math.ceil((ven.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 30) return 'ok';
    if (diff > 7) return 'warn';
    return 'bad';
  }
}
