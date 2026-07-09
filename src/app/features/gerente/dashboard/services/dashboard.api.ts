import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../../../../core/services/api-service';
import { DashboardInsumoVencimiento, DashboardRankingItem, PlatoAnalisis, DashboardAccionItem, EstadisticaMozo, IngredienteExcluidoStat, DashboardSatisfaccionMetricas } from '../../../../core/models/domain/dashboard';
import { DashboardVencimientoDto } from '../../../../core/models/dtos/responses/dashboard-vencimiento.response';
import { DashboardRendimientoResponseDto } from '../../../../core/models/dtos/responses/dashboard-rendimiento.response';
import { mapVencimientoDtoToDomain, mapRendimientoDtoToDomain, PlatoRendimientoResponse } from '../../../../infra/http/mappers/dashboard.mapper';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private api = inject(ApiService);

  getVencimientos(): Observable<DashboardInsumoVencimiento[]> {
    return this.api.get<DashboardVencimientoDto[]>('gerente/dashboard/vencimientos').pipe(
      map(dtos => dtos.map(mapVencimientoDtoToDomain))
    );
  }

  getRendimientoComercial(desde: string, hasta: string): Observable<PlatoRendimientoResponse> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.api.get<DashboardRendimientoResponseDto>('gerente/dashboard/rendimiento', params).pipe(
      map(mapRendimientoDtoToDomain)
    );
  }

  getResumenOperativo(desde: string, hasta: string): Observable<DashboardResumenOperativoResponse> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.api.get<DashboardResumenOperativoResponse>('gerente/dashboard/resumen', params);
  }

  getAnalisisPlato(nombre: string): Observable<PlatoAnalisis> {
    const params = new HttpParams().set('nombre', nombre);
    return this.api.get<PlatoAnalisis>('gerente/dashboard/analisis-plato', params);
  }

  aplicarDescuentoPlato(platoId: number, porcentajeDescuento: number): Observable<any> {
    return this.api.post<any>('gerente/dashboard/analisis-plato/aplicar-descuento', {
      platoId,
      porcentajeDescuento
    });
  }

  agendarRecordatorioPlato(platoId: number, accionSugerida: string): Observable<any> {
    return this.api.post<any>('gerente/dashboard/analisis-plato/agendar-recordatorio', {
      platoId,
      accionSugerida
    });
  }

  resolverRecordatorio(id: number): Observable<void> {
    return this.api.post<void>(`gerente/dashboard/notificaciones/${id}/resolver`, {});
  }

  getIngredientesExcluidos(desde: string, hasta: string): Observable<IngredienteExcluidoStat[]> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.api.get<IngredienteExcluidoStat[]>('gerente/dashboard/ingredientes-excluidos', params);
  }

  getSatisfaccionComensal(desde: string, hasta: string): Observable<DashboardSatisfaccionMetricas> {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    return this.api.get<DashboardSatisfaccionMetricas>('gerente/dashboard/satisfaccion', params);
  }
}

export interface VentaAgrupadaDto {
  etiqueta: string;
  total: string;
}

export interface DashboardResumenOperativoResponse {
  totalVentas: string;
  totalPedidos: number;
  ticketPromedio: string;
  promedioDiarioPedidos: number;
  variacionVentas: string;
  variacionPedidos: string;
  variacionTicket: string;
  grafico: VentaAgrupadaDto[];
  recordatorios?: DashboardAccionItem[];
  mozos: EstadisticaMozo[];
}
