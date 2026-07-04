import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api-service';
import { EncuestaResponseDto } from '../../../../core/models/dtos/responses/encuesta-response';
import { Observable } from 'rxjs/internal/Observable';
import { EncuestaRequestDto } from '../../../../core/models/dtos/requests/encuesta-request';

@Injectable({
  providedIn: 'root',
})
export class EncuestaService {
  readonly #api = inject(ApiService);


  enviar(comandaId: number, 
    puntuacionLugar: number,
    puntuacionComida:number,
    puntuacionMozo:number,
  ):Observable<EncuestaResponseDto>{
    const dto = this.#mapearRequest(comandaId,puntuacionLugar,puntuacionComida,puntuacionMozo);
    return this.#api.post<EncuestaResponseDto>('encuesta', dto);
  }
  
  #mapearRequest(comandaId: number, puntuacionLugar: number, puntuacionComida: number, puntuacionMozo: number): EncuestaRequestDto {
    return {
      comandaId,
      puntuacionLugar,
      puntuacionComida,
      puntuacionMozo
    };
  }
}
