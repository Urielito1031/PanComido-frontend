import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeComponent } from 'angularx-qrcode';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-qr-fila-virtual',
  standalone: true,
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './qr-fila-virtual.html',
  styleUrls: ['./qr-fila-virtual.css']
})
export class QrFilaVirtualPage {
  auth = inject(AuthService);

  urlQr = computed(() => {
    const rId = this.auth.restauranteId;
    if (!rId) return '';
    return `${window.location.origin}/comensal/anotarse-fila/${rId}`;
  });

  imprimirQr() {
    window.print();
  }
}
