import { Component, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { QRCodeComponent } from 'angularx-qrcode';
import { ConfiguracionVisualState } from '../../../features/comensal/services/visual/configuracion-visual-state';

import { FilaVirtualState } from '../../../features/comensal/services/fila-virtual.state';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header-comensal',
  standalone: true,
  imports: [QRCodeComponent],
  templateUrl: './header-comensal.html',
  styleUrls: ['./header-comensal.css'],
})
export class HeaderComensal {
  private router = inject(Router);
  configuracionVisualState = inject(ConfiguracionVisualState);
  filaVirtualState = inject(FilaVirtualState);
  readonly mesaId = Number(sessionStorage.getItem('mesaId')) || null;
  readonly cantidadPersonas = Number(sessionStorage.getItem('cantidadPersonas')) || null;

  showBack = input(false);
  backRoute = input<string | null>(null);
  showClose = input(false);
  title = input<string>('');
  ocultarBadgeFila = input(false);

  back = output<void>();
  close = output<void>();

  popupAbierto = signal(false);
  urlInvitacion = signal('');

  irAEstadoFila() {
    this.router.navigate(['/comensal/estado-fila']);
  }

  onBack(): void {
    const route = this.backRoute();
    if (route) {
      this.router.navigate([route]);
    } else {
      this.back.emit();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  tieneSesion(): boolean {
    const raw = sessionStorage.getItem('sesionComensal');
    const cantidadPersonas = sessionStorage.getItem('cantidadPersonas');
    return !!raw && raw !== 'undefined' && raw !== 'null' && !!cantidadPersonas;
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
    navigator.clipboard.writeText(this.urlInvitacion()).catch(() => { });
  }
}
