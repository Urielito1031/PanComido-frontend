import { Component, effect, inject, untracked, ChangeDetectionStrategy, signal } from '@angular/core';
import { ComandaState } from '../../services/comanda-state';
import { ComandaCard } from "../../components/comanda-card/comanda-card";
import {  ComandoVozService } from '../../services/comando-voz/comando-voz.service';
import { BotonVoz } from '../../../../../shared/ui/botones/boton-voz/boton-voz';
import { ComandaHubService } from '../../../../../core/services/hubs/comanda/comanda-hub-service';
import { AuthService } from '../../../../../core/services/auth.service';
import { LlamadoService } from '../../../../comensal/services/llamado.service';

const CATEGORIA_LLAMADO_COCINA = 8;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-comanda-page',
  imports: [ComandaCard, BotonVoz],
  templateUrl: './comanda-page.html',
  styleUrl: './comanda-page.css',
})

export class ComandaPage {
  state = inject(ComandaState);

  vozService = inject(ComandoVozService);

  hub = inject(ComandaHubService);
  auth = inject(AuthService);
  llamadoService = inject(LlamadoService);

  restauranteId = this.auth.restauranteId;
  notificacionLlamado = signal<number | null>(null);

  constructor() {
    effect(() => {
      const comando = this.vozService.comandoDetectado();
      if (!comando) return;

      const comanda = untracked(() =>
        this.state.comandas().find(c => c.numeroDeMesa === comando.mesaNumero)
      );

      console.log('Comando detectado:', comando);
      console.log('Comanda encontrada:', comanda);

      if (!comanda) return;

      if (comando.accion === 'llamar-mozo') {
        this.onLlamarMozo(comanda.mesaId);
      } else {
        this.state.modificarEstadoComanda(comanda.id, comando.nuevoEstadoId);
      }

      untracked(() => this.vozService.comandoDetectado.set(null));
    })
    effect(() => {
      const comandaPush = this.hub.comandaModificada();
      if (comandaPush) {
        this.state.actualizarDesdeHub(comandaPush);
      }
    })
  }
  ngOnInit() {
    this.state.cargarComandasActivas();

    this.hub.conectarYUnirseGrupo(this.restauranteId);
  }

  ngOnDestroy() {
    this.hub.desconectarEscucha();
  }

  procesarAccion(evento: { comandaId: number; estadoId: number }): void {
    this.state.modificarEstadoComanda(evento.comandaId, evento.estadoId);
  }

  onLlamarMozo(mesaId: number): void {
    const numeroDeMesa = this.state.comandas().find(c => c.mesaId === mesaId)?.numeroDeMesa ?? mesaId;
    this.llamadoService.crearLlamado({
      mesaId,
      categoriaLlamadoId: CATEGORIA_LLAMADO_COCINA,
      descripcion: 'Comanda lista para retirar',
      restauranteId: this.restauranteId,
    }).subscribe({
      next: () => {
        this.notificacionLlamado.set(numeroDeMesa);
        setTimeout(() => this.notificacionLlamado.set(null), 7000);
      }
    });
  }
}
