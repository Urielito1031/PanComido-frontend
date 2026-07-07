import { Injectable, signal } from '@angular/core';

export interface ToastConfig {
  texto: string;
  tipo: 'exito' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toastMensaje = signal<ToastConfig | null>(null);
  readonly toastMensaje = this._toastMensaje.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.mostrar('Conexión restablecida. Volviendo a operar normalmente.', 'exito');
      });
      window.addEventListener('offline', () => {
        this.mostrar('Sin conexión a Internet. Algunas funciones podrían no estar disponibles.', 'info');
      });
    }
  }

  mostrar(texto: string, tipo: 'exito' | 'info' = 'exito'): void {
    this._toastMensaje.set({ texto, tipo });
    setTimeout(() => {
      this._toastMensaje.set(null);
    }, 4000);
  }
}
