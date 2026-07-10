import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Llamado } from '../../../core/models/domain/llamado';
import { MetodoPagoId } from '../../../core/models/domain/metodo-pago';

@Injectable({ providedIn: 'root' })
export class PagoService {
  private api = inject(ApiService);

  solicitarPago(comandaId: number, restauranteId: number, metodoPago: MetodoPagoId): Observable<Llamado> {
    return this.api.post<Llamado>(`pago/solicitar-pago/${comandaId}/comensal/${restauranteId}`, { metodoPago });
  }

  solicitarPagoMP(comandaId:number, restauranteId:number):Observable<{initPoint:string}>{
    return this.api.post<{initPoint: string}>(`pago/solicitar-mp/${comandaId}/comensal/${restauranteId}`,{});
  }
}
  