import { Component, HostListener, inject, signal, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Buscador } from '../../../../../app/shared/ui/buscador/buscador';
import { ListaPlatosComensalComponent } from '../components/lista-platos-comensal/lista-platos-comensal';
import { PedidoState } from '../../services/pedido.state';
import { ItemPedido } from '../../../../core/models/domain/item-pedido';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { CartaState } from '../service/carta-state';
import { ComensalFooterCart } from '../../components/comensal-footer-cart/comensal-footer-cart';
import { FiltrosCartaOverlay } from '../../components/filtros-carta-overlay/filtros-carta-overlay';
import { CommonModule } from '@angular/common';
import { ComensalState } from '../../services/comensal-state';
import { QRCodeComponent } from 'angularx-qrcode';
import { Router } from '@angular/router';
import { FilaVirtualState } from '../../services/fila-virtual.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ver-carta',
  standalone: true,
  imports: [
    CommonModule,
    ListaPlatosComensalComponent,
    Buscador,
    ComensalFooterCart,
    FiltrosCartaOverlay,
    QRCodeComponent,
  ],
  templateUrl: './ver-carta.html',
  styleUrls: ['./ver-carta.css'],
})
export class VerCarta implements OnDestroy {
  private router = inject(Router);
  private pedidoService = inject(PedidoState);
  state = inject(CartaState);
  comensalState = inject(ComensalState);
  configuracionVisualState = inject(ConfiguracionVisualState);
  filaVirtualState = inject(FilaVirtualState);

  mostrarFiltros = signal(false);
  mesaId = signal(1);
  cantidadPersonas = signal(1);
  readonly nombreComensal = signal('');

  menuOrdenarAbierto = signal(false);
  ordenSeleccionado = signal('');
  popupAbierto = signal(false);
  urlInvitacion = signal('');
  mostrarOnboarding = signal(!sessionStorage.getItem('pancomido-onboarding-visto'));

  cantidadTotalPedido = this.pedidoService.cantidadTotal;
  totalPedido = this.pedidoService.totalPrecio;

  flyAnim = signal<{ x: number; y: number; volando: boolean; visible: boolean } | null>(null);
  private flyTimeout: ReturnType<typeof setTimeout> | null = null;
  private origenAddX = 0;
  private origenAddY = 0;

  cerrarOnboarding(): void {
    this.mostrarOnboarding.set(false);
    sessionStorage.setItem('pancomido-onboarding-visto', 'true');
  }

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    const btn = (event.target as HTMLElement).closest('.btn-add-custom') as HTMLElement | null;
    if (btn) {
      const r = btn.getBoundingClientRect();
      this.origenAddX = r.left + r.width / 2;
      this.origenAddY = r.top + r.height / 2;
    }
  }

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
    this.router.navigate(['/comensal/detalle-pedido']);
  }

  irAEstadoFila() {
    this.router.navigate(['/comensal/estado-fila']);
  }

  agregarAlPedido(item: ItemPedido): void {
    this.pedidoService.agregarPedido(item);

    const cartBtn = document.querySelector('.cart-pill-btn') as HTMLElement | null;
    if (!cartBtn) return;

    const cr = cartBtn.getBoundingClientRect();

    this.flyAnim.set({ x: this.origenAddX, y: this.origenAddY, volando: false, visible: true });

    requestAnimationFrame(() => {
      this.flyAnim.set({ x: cr.left + cr.width / 2, y: cr.top + cr.height / 2, volando: true, visible: true });
    });

    const badge = document.querySelector('.cart-count-badge') as HTMLElement | null;
    if (badge) {
      badge.classList.remove('fly-pulse');
      void badge.offsetWidth;
      badge.classList.add('fly-pulse');
      setTimeout(() => badge.classList.remove('fly-pulse'), 400);
    }

    cartBtn.classList.remove('fly-receive');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('fly-receive');
    setTimeout(() => cartBtn.classList.remove('fly-receive'), 500);

    if (this.flyTimeout) clearTimeout(this.flyTimeout);
    this.flyTimeout = setTimeout(() => this.flyAnim.set(null), 550);
  }

  ngOnDestroy(): void {
    if (this.flyTimeout) clearTimeout(this.flyTimeout);
  }
}
