import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api-service';
import { ConfiguracionVisual } from '../../../../core/models/domain/configuracion-visual';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionVisualService {
  private api = inject(ApiService);

  obtener(restauranteId: number): Observable<ConfiguracionVisual>{
    return this.api.get<ConfiguracionVisual>(`restaurante/${restauranteId}/configuracion-visual`);
  }
  
}
