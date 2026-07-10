import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CierreCajaDto } from '../../../../core/models/dtos/responses/cierre-caja.response';
import { GenerarCierreCajaRequest } from '../../../../core/models/domain/cierre-caja';

@Injectable({
  providedIn: 'root'
})
export class CierreCajaApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  generarCierre(request: GenerarCierreCajaRequest): Observable<CierreCajaDto> {
    return this.http.post<CierreCajaDto>(`${this.apiUrl}/cierre-caja/generar`, request);
  }

  getHistorial(): Observable<CierreCajaDto[]> {
    return this.http.get<CierreCajaDto[]>(`${this.apiUrl}/cierre-caja`);
  }
}
