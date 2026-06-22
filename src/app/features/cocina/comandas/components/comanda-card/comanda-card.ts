import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Comanda, EstadoComandaId } from '../../../../../core/models/domain/comanda';
import { KdsContadorTiempo } from '../../../../../shared/ui/kds-contador-tiempo/kds-contador-tiempo';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comanda-card',
  imports: [KdsContadorTiempo],
  templateUrl: './comanda-card.html',
  styleUrl: './comanda-card.css',
})
export class ComandaCard {


  comanda = input.required<Comanda>();
  accion = output<{ comandaId: number; estadoId: number }>();
  llamarMozo = output<number>();

  readonly headerClass = computed(() => {
    const map: Record<string, string> = {
      'Nueva': 'bg-danger',
      'EnPreparacion': 'bg-success',
      'EnEspera': 'bg-warning',
    };
    return map[this.comanda().estado] ?? 'bg-gray';
  });
  readonly siguienteEstado = computed<EstadoComandaId | null>(() => {
    const estado = this.comanda().estado;
    if (estado === 'Nueva') return EstadoComandaId.EnPreparacion;
    return null;
  });

  readonly textoBoton = computed(() => {
    const estado = this.comanda().estado;
    if (estado === 'Nueva') return 'ACEPTAR COMANDA';
    if (estado === 'EnPreparacion') return 'LLAMAR MOZO';
    return '';
  });

  readonly puedeActuar = computed(() => this.siguienteEstado() !== null);

  readonly mostrarBoton = computed(() =>
    this.comanda().estado === 'Nueva' || this.comanda().estado === 'EnPreparacion'
  );

  readonly itemsOrdenados = computed(() =>
    [...this.comanda().items].sort((a, b) => Number(a.entregado) - Number(b.entregado))
  );

  onAccion(): void {
    const estado = this.siguienteEstado();
    if (estado === null) return;

    this.accion.emit({
      comandaId: this.comanda().id,
      estadoId: estado,
    });
  }

  onLlamarMozo(): void {
    this.llamarMozo.emit(this.comanda().mesaId);
  }
}
