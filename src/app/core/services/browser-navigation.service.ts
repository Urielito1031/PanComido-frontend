import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BrowserNavigationService {
  abrirEnNuevaPestana(url: string): void {
    window.open(url, '_blank');
  }
}
