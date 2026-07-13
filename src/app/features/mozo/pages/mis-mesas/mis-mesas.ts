import { Component, inject, signal , ChangeDetectionStrategy} from '@angular/core';
import { Router } from '@angular/router';
import { MapaMesasReadonly } from "../../../mesas/shared/mapa-mesas-readonly/mapa-mesas-readonly";
import { MesaLecturaState } from '../../../mesas/shared/mesa-lectura-state';
import { AuthService } from '../../../../core/services/auth.service';
import { MesaService } from '../../../mesas/services/mesa.service';
import { MozoComandaService } from '../../services/mozo-comanda-service';
import { ComandaDetalleUiComponent } from '../../../../shared/components/comanda-detalle-ui/comanda-detalle-ui';
import { EstadoMesa, MesaOcupar } from '../../../../core/models/domain/mesa';
import { PagoConfirmacionService } from '../../../../shared/services/pago-confirmacion.service';
import { METODO_PAGO_LABELS, MetodoPagoId } from '../../../../core/models/domain/metodo-pago';
import { ComandaState } from '../../../comensal/services/comanda-state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-mis-mesas',
  imports: [MapaMesasReadonly, ComandaDetalleUiComponent],
  templateUrl: './mis-mesas.html',
  styleUrl: './mis-mesas.css',
})
export class MisMesasPage {


  mesaState = inject(MesaLecturaState);
  private router = inject(Router);
  private comandaState = inject(ComandaState);
  private auth = inject(AuthService);

  // Modal de ocupar mesa
  mostrarModalOcupar = signal<boolean>(false);
  mesaSeleccionadaId = signal<number | null>(null);
  cantidadComensales = signal<number>(2);

  // Prompt post-ocupar: ofrecer tomar el pedido ahí mismo
  mostrarPromptVerCarta = signal<boolean>(false);
  private mesaOcupadaComandaId: number | null = null;
  private mesaOcupadaMesaId: number | null = null;
  private mesaOcupadaCantidadComensales: number | null = null;

  // Filtro de mozo
  mostrarTodasLasMesas = signal<boolean>(false);
  mozoIdLogueado = signal<number>(this.auth.empleadoId);

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
  private pagoConfirmacionService = inject(PagoConfirmacionService);

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

  cobrarPedido(metodoPago: MetodoPagoId) {
    const comandaId = this.comandaCargada()?.id;
    if (!comandaId) return;

    this.pagoConfirmacionService.confirmarPago(comandaId, metodoPago).subscribe({
      next: () => {
        this.mesaState.mostrarNotificacion(`Pago confirmado (${METODO_PAGO_LABELS[metodoPago]})`, 'exito');
        this.cerrarModalComanda();
      },
      error: (err) => {
        if (err.status === 409) {
          this.cerrarModalComanda();
          return;
        }
        this.mesaState.mostrarNotificacion(err.error?.error || 'Error al confirmar el pago', 'error');
      }
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

    this.mesaState.ocuparMesa(mesaId, cantidadComensales).subscribe({
      next: (response: MesaOcupar) => {
        this.mesaOcupadaComandaId = response.idComandaGenerada;
        this.mesaOcupadaMesaId = mesaId;
        this.mesaOcupadaCantidadComensales = cantidadComensales;
        this.mostrarPromptVerCarta.set(true);
      }
    });

    this.cerrarModalOcupar();
  }

  cerrarModalOcupar() {
    this.mostrarModalOcupar.set(false);
    this.mesaSeleccionadaId.set(null);
    this.cantidadComensales.set(2);
  }

  irAVerCarta() {
    if (this.mesaOcupadaComandaId === null || this.mesaOcupadaMesaId === null) return;

    this.irAVerCartaConDatos(this.mesaOcupadaComandaId, this.mesaOcupadaMesaId, this.mesaOcupadaCantidadComensales ?? 1);
    this.cerrarPromptVerCarta();
  }

  cerrarPromptVerCarta() {
    this.mostrarPromptVerCarta.set(false);
    this.mesaOcupadaComandaId = null;
    this.mesaOcupadaMesaId = null;
    this.mesaOcupadaCantidadComensales = null;
  }

  irAVerCartaDesdeDetalle() {
    const comandaId = this.comandaCargada()?.id;
    const mesaId = this.mesaComandaId();
    const cantidadComensales = this.comandaCargada()?.cantComensales ?? 1;
    if (!comandaId || mesaId === null) return;

    this.irAVerCartaConDatos(comandaId, mesaId, cantidadComensales);
    this.cerrarModalComanda();
  }

  private irAVerCartaConDatos(comandaId: number, mesaId: number, cantidadComensales: number) {
    this.comandaState.setComandaDesdeSesion({
      comandaId,
      restauranteId: this.auth.restauranteId,
      mesaId,
    });
    sessionStorage.setItem('cantidadPersonas', String(cantidadComensales));
    sessionStorage.setItem('nombreComensal', 'Mozo');

    this.router.navigateByUrl('/comensal/ver-carta');
  }

  cerrarModalComanda() {
    this.mostrarModalComanda.set(false);
    this.mesaComandaId.set(null);
  }
}
