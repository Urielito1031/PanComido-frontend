import { Component, inject, OnInit, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragEnd, CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { QRCodeComponent } from 'angularx-qrcode';
import { MesaState } from '../../services/mesa.state';
import { EstadoMesa, FormaMesa, Mesa } from '../../../../core/models/domain/mesa';
import { MesaItem } from '../../../../shared/components/mesa-item/mesa-item';
import { ComandaDetalleUiComponent } from '../../../../shared/components/comanda-detalle-ui/comanda-detalle-ui';
import { AuthService } from '../../../../core/services/auth.service';
import { MesaService } from '../../services/mesa.service';
import { PagoConfirmacionService } from '../../../../shared/services/pago-confirmacion.service';
import { METODO_PAGO_LABELS, MetodoPagoId } from '../../../../core/models/domain/metodo-pago';

@Component({
  selector: 'app-mapa-mesas',
  standalone: true,
  imports: [CommonModule, DragDropModule, MesaItem, ComandaDetalleUiComponent, QRCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mapa-mesas.html',
  styleUrl: './mapa-mesas.css'
})
export class MapaMesas implements OnInit {
  state = inject(MesaState);
  auth = inject(AuthService);
  mesaService = inject(MesaService);
  pagoConfirmacionService = inject(PagoConfirmacionService);
  FormaMesa = FormaMesa;
  mesaMobileSeleccionada = signal<Mesa | null>(null);

  // Modal de ocupar mesa
  mostrarModalOcupar = signal<boolean>(false);
  mesaSeleccionadaId = signal<number | null>(null);
  cantidadComensales = signal<number>(2);

  // Modal de comanda
  mostrarModalComanda = signal<boolean>(false);
  mesaComandaId = signal<number | null>(null);

  // Modal / Offcanvas detalle de comanda ocupada
  mostrarComandaDetalle = signal<boolean>(false);
  comandaCargada = signal<any>(null);

  // Asignacion Mozos
  modoFiltroAsignacion = signal<boolean>(false);
  mostrarModalAsignacion = signal<boolean>(false);
  mozosSeleccionadosIds = signal<number[]>([]);
  mozosDisponibles = signal<{ id: number, nombre: string }[]>([]);

  // Modal QR
  mostrarModalQr = signal<boolean>(false);
  mesaQrId = signal<number | null>(null);
  urlQr = computed(() => {
    const mId = this.mesaQrId();
    if (!mId) return '';
    return `${window.location.origin}/comensal/mesa/${this.auth.restauranteId}/${mId}`;
  });

  toggleFiltroAsignacion() {
    this.modoFiltroAsignacion.update(v => !v);
  }

  mesasFiltradas = computed(() => {
    const todas = this.state.mesas().filter(m => m.tipoElemento !== 2);
    if (this.modoFiltroAsignacion()) {
      if (this.auth.rol() === 'Mozo') {
        const myId = this.auth.empleadoId;
        return todas.filter(m => m.mozosAsignadosIds?.includes(myId));
      } else {
        return todas.filter(m => m.mozosAsignadosIds && m.mozosAsignadosIds.length > 0);
      }
    }
    return todas;
  });

  mesasTotales = computed(() => this.mesasFiltradas().length);
  mesasDisponibles = computed(() => this.mesasFiltradas().filter(m => m.estadoMesa === EstadoMesa.Disponible).length);
  mesasOcupadas = computed(() => this.mesasFiltradas().filter(m => m.estadoMesa === EstadoMesa.Ocupada).length);

  ngOnInit() {
    this.state.cargarMesas(); // Dispara la carga inicial al mock
    this.mesaService.getMozos().subscribe(mozos => {
      this.mozosDisponibles.set(mozos);
    });
  }

  seleccionarMesaMobile(mesa: Mesa) {
    this.mesaMobileSeleccionada.set(mesa);
  }

  volverGridMobile() {
    this.mesaMobileSeleccionada.set(null);
  }

  abrirMesaMobile() {
    if (this.mesaMobileSeleccionada()) {
      this.ejecutarAccion(this.mesaMobileSeleccionada()!.id, 'ocupar');
      this.mesaMobileSeleccionada.set(null); // Volvemos al grid automáticamente
    }
  }

  cerrarMesaMobile() {
    if (this.mesaMobileSeleccionada()) {
      this.ejecutarAccion(this.mesaMobileSeleccionada()!.id, 'cerrar');
      this.mesaMobileSeleccionada.set(null);
    }
  }

  habilitarMesaMobile() {
    if (this.mesaMobileSeleccionada()) {
      this.ejecutarAccion(this.mesaMobileSeleccionada()!.id, 'cerrar');
      this.mesaMobileSeleccionada.set(null);
    }
  }

  deshabilitarMesaMobile() {
    if (this.mesaMobileSeleccionada()) {
      this.ejecutarAccion(this.mesaMobileSeleccionada()!.id, 'deshabilitar');
      this.mesaMobileSeleccionada.set(null);
    }
  }

  verComandaMobile() {
    if (this.mesaMobileSeleccionada()) {
      this.ejecutarAccion(this.mesaMobileSeleccionada()!.id, 'detalles');
    }
  }

  gridSize = 15; // El tamaño de tu grilla en píxeles

  // Función que fuerza a la mesa a moverse visualmente en saltos de 15px


  // Mapa de colisiones activas
  colisionesActivas = signal<Record<number, boolean>>({});

  onDragMoved(id: number, event: CdkDragMove) {
    const mesaActual = this.state.mesas().find(m => m.id === id);
    if (!mesaActual) return;

    const x = mesaActual.posicionXInicio + event.distance.x;
    const y = mesaActual.posicionYInicio + event.distance.y;
    const ancho = mesaActual.posicionXFin - mesaActual.posicionXInicio;
    const alto = mesaActual.posicionYFin - mesaActual.posicionYInicio;

    const colision = this.state.mesas().some(otra => {
      if (otra.id === id) return false;
      const superponenX = x < otra.posicionXFin && (x + ancho) > otra.posicionXInicio;
      const superponenY = y < otra.posicionYFin && (y + alto) > otra.posicionYInicio;
      return superponenX && superponenY;
    });

    this.colisionesActivas.update(cols => ({ ...cols, [id]: colision }));
  }

  onDragEnded(id: number, event: CdkDragEnd) {
    const hayColision = this.colisionesActivas()[id];
    this.colisionesActivas.update(cols => ({ ...cols, [id]: false }));

    if (hayColision) {
      event.source._dragRef.reset();
      return;
    }

    // También ajustamos la matemática acá para que el Signal guarde el múltiplo exacto
    const deltaX = Math.round(event.distance.x / this.gridSize) * this.gridSize;
    const deltaY = Math.round(event.distance.y / this.gridSize) * this.gridSize;

    if (deltaX === 0 && deltaY === 0) return;

    event.source._dragRef.reset();
    this.state.moverMesa(id, deltaX, deltaY);
  }
  ejecutarAccion(id: number, accion: string) {
    switch (accion) {
      case 'ocupar':
        this.mesaSeleccionadaId.set(id);
        this.mostrarModalOcupar.set(true);
        break;
      case 'cerrar':
        this.state.cambiarEstadoMesa(id, EstadoMesa.Disponible);
        break;
      case 'deshabilitar':
        this.state.cambiarEstadoMesa(id, EstadoMesa.Deshabilitada);
        break;
      case 'detalles':
        this.mesaSeleccionadaId.set(id);
        this.mesaService.getComandaActivaPorMesa(id).subscribe({
          next: (comanda) => {
            this.comandaCargada.set(comanda);
            this.mostrarComandaDetalle.set(true);
          },
          error: () => this.state.mostrarNotificacion('Error al cargar la comanda', 'error')
        });
        this.state.seleccionarMesa(null);
        break;
      case 'asignar-mozo':
        this.mesaSeleccionadaId.set(id);
        const mesa = this.state.mesas().find(m => m.id === id);
        this.mozosSeleccionadosIds.set(mesa?.mozosAsignadosIds ? [...mesa.mozosAsignadosIds] : []);
        this.mostrarModalAsignacion.set(true);
        this.state.seleccionarMesa(null);
        break;
      case 'generar-qr':
        this.mesaQrId.set(id);
        this.mostrarModalQr.set(true);
        this.state.seleccionarMesa(null);
        break;
    }
  }

  cerrarModalQr() {
    this.mostrarModalQr.set(false);
    this.mesaQrId.set(null);
  }

  imprimirQr() {
    window.print();
  }

  onMesaClick(id: number) {
    if (this.state.isEditorMode()) return;

    // Próximamente: Llamar al backend para traer la comanda activa por MesaId
    // Ej: GET /comanda/mesa/{id}/activa
    console.warn('onMesaClick no implementado aún');
  }

  confirmarOcupar() {
    const mesaId = this.mesaSeleccionadaId();
    const comensales = this.cantidadComensales();
    if (mesaId === null || comensales < 1) return;
    this.state.ocuparMesa(mesaId, comensales);
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

  cerrarModalAsignacion() {
    this.mostrarModalAsignacion.set(false);
  }

  cerrarComandaDetalle() {
    this.mostrarComandaDetalle.set(false);
    this.comandaCargada.set(null);
    this.mesaSeleccionadaId.set(null);
  }

  calcularTotalComanda(items: any[]): number {
    return items.reduce((acc, item) => acc + ((item.articulo.precioVentaFinal || 0) * item.cantidad), 0);
  }

  cobrarComanda(metodoPago: MetodoPagoId) {
    const comandaId = this.comandaCargada()?.id;
    if (!comandaId) return;

    this.pagoConfirmacionService.confirmarPago(comandaId, metodoPago).subscribe({
      next: () => {
        this.state.mostrarNotificacion(`Pago confirmado (${METODO_PAGO_LABELS[metodoPago]})`, 'exito');
        this.cerrarComandaDetalle();
      },
      error: (err) => {
        if (err.status === 409) {
          this.cerrarComandaDetalle();
          return;
        }
        this.state.mostrarNotificacion(err.error?.error || 'Error al confirmar el pago', 'error');
      }
    });
  }

  cerrarMesaComanda() {
    console.log('Cerrar mesa clickeado para comanda', this.comandaCargada()?.id);
    if (this.mesaSeleccionadaId()) {
      this.ejecutarAccion(this.mesaSeleccionadaId()!, 'cerrar');
    }
    this.cerrarComandaDetalle();
  }

  guardarAsignacionMozos() {
    const mesaId = this.mesaSeleccionadaId();
    if (mesaId === null) return;

    this.mesaService.asignarMozos(mesaId, this.mozosSeleccionadosIds()).subscribe({
      next: () => {
        this.state.mostrarNotificacion('Mozos asignados correctamente', 'exito');
        this.state.cargarMesas(); // recargar para ver cambios
        this.cerrarModalAsignacion();
      },
      error: () => this.state.mostrarNotificacion('Error al asignar mozos', 'error')
    });
  }

  mesasOrdenadas() {
    return [...this.state.mesas()]
      .filter(m => m.tipoElemento !== 2)
      .sort((a, b) => a.numeroMesa - b.numeroMesa);
  }

  getMesaColor(mesa: Mesa): string {
    if (mesa.tipoElemento === 2) return mesa.color || '#34495e';
    switch (mesa.estadoMesa) {
      case EstadoMesa.Disponible: return '#5cb85c';
      case EstadoMesa.Ocupada: return '#c0392b';
      case EstadoMesa.Reservada: return '#f1c40f';
      default: return '#95a5a6';
    }
  }

  getMobileClass(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'disponible': return 'disponible';
      case 'ocupada': return 'ocupada';
      case 'reservada': return 'reservada';
      case 'deshabilitada': return 'deshabilitada';
      default: return 'disponible';
    }
  }

}
