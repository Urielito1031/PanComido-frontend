import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { IScannerControls } from '@zxing/browser/esm/common/IScannerControls';
import { HeaderComensal } from '../../../../shared/ui/header-comensal/header-comensal';
import { FilaVirtualState } from '../../services/fila-virtual.state';
import { ComandaState } from '../../services/comanda-state';
import { inject } from '@angular/core';

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
  
  filaVirtualState = inject(FilaVirtualState);
  comandaState = inject(ComandaState);

  constructor(private router: Router) { }

async ngAfterViewInit() {
  try {
    // Pasar undefined como deviceId permite que el navegador/SO seleccione 
    // su cámara predeterminada. Evita el "NotReadableError" que suele darse 
    // por intentar forzar una cámara ocupada o virtual listada en devices[0].
    this.controls = await this.scanner.decodeFromVideoDevice(
      undefined,
      this.video.nativeElement,
      (result) => {
        if (result && !this.scanResult) {
          this.scanResult = true;

          const texto = result.getText();
          console.log('QR leído:', texto);

          try {
            // Usamos new URL() para que sea independiente de si es localhost, netlify, o azure.
            const url = new URL(texto);
            const pathParts = url.pathname.split('/').filter(p => p.length > 0);

            if (pathParts[0] === 'comensal') {
              
              // 1. MESA: /comensal/mesa/idrestaurante/idmesa
              if (pathParts[1] === 'mesa' && pathParts.length === 4) {
                const restauranteId = parseInt(pathParts[2], 10);
                const mesaId = parseInt(pathParts[3], 10);
                
                const turnoId = this.filaVirtualState.turnoId();
                if (turnoId) {
                  const cantidad = this.filaVirtualState.estado()?.cantidadPersonas ?? 1;
                  const nombre = this.filaVirtualState.estado()?.nombreCliente ?? 'Comensal';
                  
                  this.comandaState.ocuparMesa(restauranteId, mesaId, cantidad, nombre, turnoId).subscribe(() => {
                    this.router.navigate(['/comensal/ver-carta']);
                  });
                } else {
                  this.router.navigate(['/comensal/mesa', restauranteId, mesaId]);
                }
                return;
              }

              // 2. FILA VIRTUAL: /comensal/anotarse-fila/idrestaurante
              if (pathParts[1] === 'anotarse-fila' && pathParts.length === 3) {
                const restauranteId = parseInt(pathParts[2], 10);
                this.router.navigate(['/comensal/anotarse-fila', restauranteId]);
                return;
              }

              // 3. INVITACIÓN COMANDA: /comensal/unirse/idComanda
              if (pathParts[1] === 'unirse' && pathParts.length === 3) {
                const idComanda = parseInt(pathParts[2], 10);
                this.router.navigate(['/comensal/unirse', idComanda]);
                return;
              }
            }

            console.warn('QR leído pero la URL no coincide con ningún componente esperado:', texto);
            this.scanResult = false; // Permitir escanear de nuevo
          } catch (e) {
            console.warn('El texto leído del QR no es una URL válida:', texto);
            this.scanResult = false; // Permitir escanear de nuevo
          }
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
