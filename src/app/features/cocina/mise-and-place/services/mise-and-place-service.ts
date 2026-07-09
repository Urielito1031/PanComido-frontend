import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api-service';
import { Observable } from 'rxjs';
import { DatosFormularioMiseAndPlaceDto, MiseAndPlaceListadoDto } from '../../../../core/models/dtos/responses/mise-and-place.response';
import { CrearMiseAndPlaceDto, ModificarMiseAndPlaceDto } from '../../../../core/models/dtos/requests/mise-and-place.request';

@Injectable({
  providedIn: 'root',
})
export class MiseAndPlaceService {
  private api = inject(ApiService);
  private endpoint  = 'miseandplace';

  obtenerFormData(): Observable<DatosFormularioMiseAndPlaceDto> {
    return this.api.get<DatosFormularioMiseAndPlaceDto>(`${this.endpoint}/obtener-ingredientes`);
  }

  listar(): Observable<MiseAndPlaceListadoDto[]>{
    return this.api.get<MiseAndPlaceListadoDto[]>(`${this.endpoint}/listar`);
  }

  obtenerPorId(id:number): Observable<MiseAndPlaceListadoDto>{
    return this.api.get<MiseAndPlaceListadoDto>(`${this.endpoint}/${id}`);
  }

  crear(dto: CrearMiseAndPlaceDto): Observable<MiseAndPlaceListadoDto>{
    return this.api.post<MiseAndPlaceListadoDto>(`${this.endpoint}/crear`, dto);
  }

  modificar(id: number, dto: ModificarMiseAndPlaceDto): Observable<MiseAndPlaceListadoDto>{
    return this.api.put<MiseAndPlaceListadoDto>(`${this.endpoint}/${id}`, dto);
  }

  eliminar(id: number): Observable<void>{
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

}
