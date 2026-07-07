import { Injectable, signal } from '@angular/core';

export interface ToastConfig {
  texto: string;
  tipo: 'exito' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toastMensaje = signal<ToastConfig | null>(null);
  readonly toastMensaje = this._toastMensaje.asReadonly();

  mostrar(texto: string, tipo: 'exito' | 'info' = 'exito'): void {
    this._toastMensaje.set({ texto, tipo });
    setTimeout(() => {
      this._toastMensaje.set(null);
    }, 4000);
  }
}
