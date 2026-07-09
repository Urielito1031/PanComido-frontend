import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../core/services/api-service';
import { Bodega } from '../../../../../core/models/domain/bodega';
import { TipoBodega } from '../../../../../core/models/domain/tipo-bodega';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BodegaService {


  private api = inject(ApiService);
  private endpoint = 'Bodega';

  obtenerBodegas(): Observable<Bodega[]> {
    return this.api.get<Bodega[]>(this.endpoint);
  }
  obtenerBodegasConInsumos(): Observable<Bodega[]> {
    return this.api.get<Bodega[]>(`${this.endpoint}/con-insumos`);
  }
  obtenerBodegaPorId(id: number): Observable<Bodega> {
    return this.api.get<Bodega>(`${this.endpoint}/${id}`);
  }
  obtenerTiposBodega(): Observable<TipoBodega[]> {
    return this.api.get<TipoBodega[]>('tipo-bodega');
  }
  crearBodega(bodega: { nombre: string; tipoBodegaId: number }): Observable<Bodega> {
    return this.api.post<Bodega>(this.endpoint, bodega);
  }
  modificarBodega(id: number, bodega: { nombre: string; tipoBodegaId: number }): Observable<Bodega> {
    return this.api.put<Bodega>(`${this.endpoint}/${id}`, bodega);
  }
  eliminarBodega(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
