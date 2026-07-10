import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api-service';
import { MetodoPagoId } from '../../core/models/domain/metodo-pago';

@Injectable({ providedIn: 'root' })
export class PagoConfirmacionService {
  private api = inject(ApiService);

  confirmarPago(comandaId: number, metodoPago: MetodoPagoId): Observable<void> {
    return this.api.post<void>(`pago/confirmar-pago/${comandaId}`, { metodoPago });
  }
}
