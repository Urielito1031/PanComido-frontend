import { Component, inject, signal , ChangeDetectionStrategy} from '@angular/core';
import { MapaMesasReadonly } from "../../../mesas/shared/mapa-mesas-readonly/mapa-mesas-readonly";
import { MesaLecturaState } from '../../../mesas/shared/mesa-lectura-state';
import { AuthService } from '../../../../core/services/auth.service';
import { MesaService } from '../../../mesas/services/mesa.service';
import { MozoComandaService } from '../../services/mozo-comanda-service';
import { ComandaDetalleUiComponent } from '../../../../shared/components/comanda-detalle-ui/comanda-detalle-ui';
import { EstadoMesa } from '../../../../core/models/domain/mesa';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mis-mesas',
  imports: [MapaMesasReadonly, ComandaDetalleUiComponent],
  templateUrl: './mis-mesas.html',
  styleUrl: './mis-mesas.css',
})
export class MisMesasPage {


  private mesaState = inject(MesaLecturaState);
  // Modal de ocupar mesa
  mostrarModalOcupar = signal<boolean>(false);
  mesaSeleccionadaId = signal<number | null>(null);
  cantidadComensales = signal<number>(2);

  // Filtro de mozo
  mostrarTodasLasMesas = signal<boolean>(false);
  mozoIdLogueado = signal<number>(inject(AuthService).empleadoId);

  filtroMozoActivo() {
    return this.mostrarTodasLasMesas() ? null : this.mozoIdLogueado();
  }

  toggleMostrarTodas() {
    this.mostrarTodasLasMesas.update(v => !v);
  }

  // Modal de comanda
  mostrarModalComanda = signal<boolean>(false);
  mesaComandaId = signal<number | null>(null);

  onMesaSeleccionada(mesaId: number) {
    console.warn('onMesaSeleccionada no implementado aún');
  }

  onOcuparMesa(mesaId: number) {
    this.mesaSeleccionadaId.set(mesaId);
    this.mostrarModalOcupar.set(true);
  }

  private mesaService = inject(MesaService);
  private mozoComandaService = inject(MozoComandaService);

  comandaCargada = signal<any>(null);

  onVerDetalles(mesaId: number) {
    this.mesaComandaId.set(mesaId);
    this.mesaService.getComandaActivaPorMesa(mesaId).subscribe({
      next: (comanda) => {
        this.comandaCargada.set(comanda);
        this.mostrarModalComanda.set(true);
      },
      error: () => this.mesaState.mostrarNotificacion('Error al cargar la comanda o no hay activa', 'error')
    });
  }

  calcularTotalComanda(items: any[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((acc, curr) => acc + ((curr.articulo?.precioVentaFinal || 0) * curr.cantidad), 0);
  }

  cobrarPedido() {
    const comandaId = this.comandaCargada()?.id;
    if (!comandaId) return;

    this.mozoComandaService.confirmarPagoEfectivo(comandaId).subscribe({
      next: () => this.cerrarModalComanda(),
      error: () => this.mesaState.mostrarNotificacion('Error al confirmar el pago', 'error')
    });
  }

  cerrarMesaComanda() {
    const id = this.mesaComandaId();
    if (id) {
      this.mesaState.cambiarEstadoMesa(id, EstadoMesa.Disponible);
    }
    this.cerrarModalComanda();
  }

  confirmarOcupar() {
    const mesaId = this.mesaSeleccionadaId();
    const cantidadComensales = this.cantidadComensales();
    if (mesaId === null || cantidadComensales < 1) return;
    this.mesaState.ocuparMesa(mesaId, cantidadComensales);

    this.cerrarModalOcupar();
  }

  cerrarModalOcupar() {
    this.mostrarModalOcupar.set(false);
    this.mesaSeleccionadaId.set(null);
    this.cantidadComensales.set(2);
  }

  cerrarModalComanda() {
    this.mostrarModalComanda.set(false);
    this.mesaComandaId.set(null);
  }
}
