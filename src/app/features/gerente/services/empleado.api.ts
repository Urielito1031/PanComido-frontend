import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Empleado, EmpleadoNuevo, EmpleadoEdicion } from '../../../core/models/domain/empleado';

interface EmpleadoMutationResponseDto {
  mensaje: string;
  empleado: Empleado;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoApiService {
  private readonly api = inject(ApiService);
  private readonly endpoint = 'empleado';

  getEmpleados(): Observable<Empleado[]> {
    return this.api.get<Empleado[]>(this.endpoint);
  }

  crearEmpleado(req: EmpleadoNuevo): Observable<EmpleadoMutationResponseDto> {
    return this.api.post<EmpleadoMutationResponseDto>(this.endpoint, req);
  }

  modificarEmpleado(id: number, req: EmpleadoEdicion): Observable<EmpleadoMutationResponseDto> {
    return this.api.put<EmpleadoMutationResponseDto>(`${this.endpoint}/${id}`, req);
  }

  eliminarEmpleado(id: number): Observable<{ mensaje: string }> {
    return this.api.delete<{ mensaje: string }>(`${this.endpoint}/${id}`);
  }
}
