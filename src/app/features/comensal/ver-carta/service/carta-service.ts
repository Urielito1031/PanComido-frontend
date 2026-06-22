import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api-service';
import { Observable } from 'rxjs';
import { CartaItem } from '../../../../core/models/domain/carta-item';

@Injectable({
  providedIn: 'root',
})
export class CartaService {
  private api = inject(ApiService)
  private endpoint = 'carta'

  obtenerCarta(restauranteId: number): Observable<CartaItem[]> {
    return this.api.get<CartaItem[]>(`${this.endpoint}/${restauranteId}/comensal`);
  }
}
