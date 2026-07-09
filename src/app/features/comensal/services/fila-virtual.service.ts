import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FilaVirtualService {
  private http = inject(HttpClient);

  anotarse(restauranteId: number, body: { nombreCliente: string, cantidadPersonas: number }) {
    const payload = { cantComensales: body.cantidadPersonas };
    return this.http.post<any>(`${environment.apiUrl}/api/restaurantes/${restauranteId}/mesas/fila-virtual/anotarse`, payload);
  }

  guardarPedidoPreArmado(turnoId: number, pedidos: any[]) {
    // Mock the backend call since there is no endpoint yet
    return of({ success: true }).pipe(delay(500));
  }

  cancelarTurno(restauranteId: number, turnoId: number) {
    return this.http.put<any>(`${environment.apiUrl}/api/restaurantes/${restauranteId}/mesas/fila-virtual/turnos/${turnoId}/cancelar`, {});
  }
}
