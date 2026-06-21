import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { IScannerControls } from '@zxing/browser/esm/common/IScannerControls';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-escanear-mesa',
  imports: [HeaderComensal],
  templateUrl: './escanear-mesa.html',
  styleUrls: ['./escanear-mesa.css']
})
export class ScanQr implements AfterViewInit, OnDestroy {

  @ViewChild('video')
  video!: ElementRef<HTMLVideoElement>;

  scanner = new BrowserMultiFormatReader();
  private controls: IScannerControls | null = null;
  private scanResult = false;

  constructor(private router: Router) { }

async ngAfterViewInit() {
  try {
    const devices = await BrowserMultiFormatReader.listVideoInputDevices();

    if (devices.length === 0) {
      console.warn('No se encontraron dispositivos de cámara');
      return;
    }

    this.controls = await this.scanner.decodeFromVideoDevice(
      devices[0].deviceId,
      this.video.nativeElement,
      (result) => {
        if (result && !this.scanResult) {
          this.scanResult = true;

          const texto = result.getText();

          console.log('QR leído:', texto);

          const mesaId = parseInt(texto, 10);

          if (!Number.isInteger(mesaId)) {
            console.warn('QR inválido:', texto);
            return;
          }

          this.router.navigate([
            '/comensal/mesa',
            1,      // restauranteId
            mesaId  // obtenido del QR
          ]);
        }
      }
    );
  } catch (e) {
    console.error('Error al inicializar escáner:', e);
  }
}

  ngOnDestroy() {
    this.controls?.stop();
  }

  cerrarScanner() {
    this.controls?.stop();
    window.history.back();
  }
}
