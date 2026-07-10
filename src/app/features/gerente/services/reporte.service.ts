import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reporte`;

  descargarReporteDashboard(fechaInicio: string, fechaFin: string): Observable<Blob> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get(`${this.apiUrl}/dashboard/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  descargarReportePersonal(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/personal/pdf`, {
      responseType: 'blob'
    });
  }

  descargarReporteVentas(fechaInicio: string, fechaFin: string): Observable<Blob> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get(`${this.apiUrl}/ventas/pdf`, {
      params,
      responseType: 'blob'
    });
  }
}
