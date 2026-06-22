import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { BienvenidaResponseDto } from '../../../core/models/dtos/responses/bienvenida.response';

@Injectable({ providedIn: 'root' })
export class MesaComensalService {

  private api = inject(ApiService);

  obtenerBienvenida(mesaId: number, restauranteId: number): Observable<BienvenidaResponseDto> {
    return this.api.get<BienvenidaResponseDto>(`mesa/${mesaId}/comensal/${restauranteId}/bienvenida`
    );
  }

   obtenerBienvenidaInvitado(comandaId: number) {
    return this.api.get<any>(`comanda/${comandaId}/comensal/bienvenida-invitado`);
  }
}
