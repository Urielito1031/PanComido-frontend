import { Component, HostListener, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Buscador } from '../../../../../app/shared/ui/buscador/buscador';
import { ListaPlatosComensalComponent } from '../components/lista-platos-comensal/lista-platos-comensal';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import { PedidoState } from '../../services/pedido.state';
import { ItemPedido } from '../../../../core/models/domain/item-pedido';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { CartaState } from '../service/carta-state';
import { ComensalFooterCart } from '../../components/comensal-footer-cart/comensal-footer-cart';
import { FiltrosCartaOverlay } from '../../components/filtros-carta-overlay/filtros-carta-overlay';
import { CommonModule } from '@angular/common';
import { ComensalState } from '../../services/comensal-state';
import { ComandaState } from '../../services/comanda-state';
import { QRCodeComponent } from 'angularx-qrcode';
import { Router } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ver-carta',
  standalone: true,
  imports: [
    CommonModule,
    ListaPlatosComensalComponent,
    Buscador,
    FontAwesomeModule,
    ComensalFooterCart,
    FiltrosCartaOverlay,
    QRCodeComponent,
  ],
  templateUrl: './ver-carta.html',
  styleUrls: ['./ver-carta.css'],
})
export class VerCarta {
  private router = inject(Router);
  private pedidoService = inject(PedidoState);
  state = inject(CartaState);
  comensalState = inject(ComensalState);
  configuracionVisualState = inject(ConfiguracionVisualState);

  mostrarFiltros = signal(false);
  faFilter = faFilter;
  mesaId = signal(1);
  cantidadPersonas = signal(1);
  readonly nombreComensal = signal('');

  menuOrdenarAbierto = signal(false);
  ordenSeleccionado = signal('');
  popupAbierto = signal(false);
  urlInvitacion = signal('');

  // Usar computed del servicio para reactividad
  cantidadTotalPedido = this.pedidoService.cantidadTotal;
  totalPedido = this.pedidoService.totalPrecio;

  @HostListener('document:click', ['$event'])
  onClickOutSide(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-ordenar')) {
      this.menuOrdenarAbierto.set(false);
    }
  }

  toggleMenuOrdenar(): void {
    this.menuOrdenarAbierto.update((v) => !v);
  }

  seleccionarOrden(criterio: string, label: string): void {
    this.ordenSeleccionado.set(label);
    this.state.setOrdenar(criterio);
    this.menuOrdenarAbierto.set(false);
  }

  ngOnInit(): void {
    const nombre = sessionStorage.getItem('nombreComensal');

    if (nombre) {
      this.nombreComensal.set(nombre);
    }

    this.mesaId.set(Number(sessionStorage.getItem("mesaId")));
    this.cantidadPersonas.set(Number(sessionStorage.getItem("cantidadPersonas")));

    const restauranteId = Number(sessionStorage.getItem('restauranteId'));
    console.log('El restauranteId por sesion:', restauranteId);

    this.state.cargarCarta(restauranteId);

    const sesionRaw = sessionStorage.getItem('sesionComensal');

    if (!sesionRaw || sesionRaw === 'undefined') {
      console.error('No hay sesión válida de comensal');
      return;
    }
  }

  abrirCompartir(): void {
    const raw = sessionStorage.getItem('sesionComensal');
    if (!raw || raw === 'undefined' || raw === 'null') return;

    try {
      const sesion = JSON.parse(raw);
      const comandaId = sesion.idComandaGenerada ?? sesion.comandaId;
      this.urlInvitacion.set(`${window.location.origin}/comensal/unirse/${comandaId}`);
      this.popupAbierto.set(true);
    } catch {
      console.error('Error al parsear sesionComensal');
    }
  }

  cerrarCompartir(): void {
    this.popupAbierto.set(false);
  }

  copiarEnlace(): void {
    navigator.clipboard.writeText(this.urlInvitacion()).catch(() => {});
  }

  onSearch(valor: string): void {
    this.state.setBusqueda(valor);
  }

  irAPedido(): void {
    this.router.navigate(['/comensal/pedido']);
  }

  agregarAlPedido(item: ItemPedido): void {
    this.pedidoService.agregarPedido(item);
  }
}
