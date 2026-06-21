import { TestBed } from '@angular/core/testing';
import { ScanQr } from './escanear-mesa';
import { Router } from '@angular/router';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { vi } from 'vitest';

describe('ScanQr', () => {
  let component: ScanQr;

  const routerMock = {
    navigate: vi.fn()
  };

  let decodeMock: any;
  let stopMock: any;

  beforeEach(async () => {
    stopMock = vi.fn();

    decodeMock = vi.fn().mockImplementation((_deviceId, _video, cb) => {
      // simulamos lectura de QR
      setTimeout(() => {
        cb({
          getText: () => '15'
        });
      }, 0);

      return {
        stop: stopMock
      };
    });

    vi.spyOn(BrowserMultiFormatReader, 'listVideoInputDevices')
      .mockResolvedValue([
        { deviceId: 'camera-1' } as any
      ]);

    vi.spyOn(BrowserMultiFormatReader.prototype, 'decodeFromVideoDevice')
      .mockImplementation(decodeMock);

    await TestBed.configureTestingModule({
      imports: [ScanQr],
      providers: [
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ScanQr);
    component = fixture.componentInstance;

    // mock ViewChild video
    component.video = {
      nativeElement: document.createElement('video')
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar cámara y navegar con QR válido', async () => {
    await component.ngAfterViewInit();

    await new Promise((r) => setTimeout(r, 10));

    expect(routerMock.navigate).toHaveBeenCalledWith([
      '/comensal/mesa',
      1,
      15
    ]);
  });

 

  it('debería cerrar scanner', () => {
    const stop = vi.fn();
    component['controls'] = { stop } as any;

    component.cerrarScanner();

    expect(stop).toHaveBeenCalled();
  });
});