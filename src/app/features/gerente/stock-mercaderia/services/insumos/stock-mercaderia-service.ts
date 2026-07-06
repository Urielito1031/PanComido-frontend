import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../../core/services/api-service';
import { map, Observable } from 'rxjs';
import { Insumo, InsumoDetalle, LoteInsumo } from '../../../../../core/models/domain/insumo';
import { InsumoResponseDto } from '../../../../../core/models/dtos/responses/insumo.response';
import { DetalleInsumoResponseDto } from '../../../../../core/models/dtos/responses/detalle-insumo.response';
import { LoteResponseDto } from '../../../../../core/models/dtos/responses/lote.response';
import { CrearInsumoRequest } from '../../../../../core/models/dtos/requests/crear-insumo.request';
import { ModificarInsumoRequestDto } from '../../../../../core/models/dtos/requests/modificar-insumo.request';

import { mapInsumoDtoToDomain, mapDetalleInsumoDtoToDomain } from '../../../../../infra/http/mappers/insumo.mapper';

@Injectable({ providedIn: 'root' })

export class StockMercaderiaService {
  private api = inject(ApiService);
  private endpoint = 'insumo';

  getStockMercaderia(): Observable<Insumo[]> {
    return this.api.get<InsumoResponseDto[]>(this.endpoint).pipe(
      map(dtos => dtos.map(mapInsumoDtoToDomain))
    );
  }

  getById(id: number): Observable<InsumoDetalle> {
    return this.api.get<DetalleInsumoResponseDto>(`${this.endpoint}/${id}`).pipe(
      map(mapDetalleInsumoDtoToDomain)
    );
  }

  getLotes(): Observable<LoteInsumo[]> {
    return this.api.get<LoteResponseDto[]>(`${this.endpoint}/lotes`).pipe(
      map(dtos => dtos.map(dto => ({
        id: dto.id,
        nombre: dto.nombre,
        insumoId: dto.insumoId,
        cantidad: dto.cantidad,
        fechaVencimiento: dto.fechaVencimiento,
        bodegaId: dto.bodegaId
      })))
    );
  }

  crear(producto: CrearInsumoRequest): Observable<Insumo> {
    return this.api.post< {insumo: InsumoResponseDto, mensaje: string} >(this.endpoint, producto).pipe(
      map(response => mapInsumoDtoToDomain(response.insumo))
    );
  }

  actualizar(id: number, producto: Partial<Insumo>): Observable<Insumo> {
    return this.api.put<Insumo>(`${this.endpoint}/${id}`, producto);
  }

  actualizarInsumoConImagen(id: number, request: ModificarInsumoRequestDto, imagen?: File): Observable<InsumoDetalle> {
    const formData = this.modificarInsumoAFormData(request, imagen);
    return this.api.put<{ mensaje: string }>(`${this.endpoint}/${id}`, formData).pipe(
      map(() => this.mapModificarRequestToDomain(id, request))
    );
  }

  private modificarInsumoAFormData(request: ModificarInsumoRequestDto, imagen?: File): FormData {
    const formData = new FormData();
    formData.append('Nombre', request.nombre);
    formData.append('EsPrecioManual', request.esPrecioManual ? 'true' : 'false');
    formData.append('StockMinimo', request.stockMinimo.toString());
    formData.append('StockRecomendado', request.stockRecomendado.toString());
    formData.append('CategoriaId', request.categoriaId.toString());
    formData.append('UnidadDeMedidaId', request.unidadDeMedidaId.toString());

    if (request.descripcion) {
      formData.append('Descripcion', request.descripcion);
    }
    if (request.precioVentaFinal !== undefined) {
      formData.append('PrecioVentaFinal', request.precioVentaFinal.toString().replace('.', ','));
    }
    if (imagen) {
      formData.append('Imagen', imagen);
    }
    return formData;
  }

  private mapModificarRequestToDomain(id: number, request: ModificarInsumoRequestDto): InsumoDetalle {
    return {
      id,
      nombre: request.nombre,
      descripcion: request.descripcion ?? null,
      precioVentaFinal: request.precioVentaFinal,
      esPrecioManual: request.esPrecioManual,
      stockMinimo: request.stockMinimo,
      stockRecomendado: request.stockRecomendado,
      categoriaId: request.categoriaId,
      unidadDeMedidaId: request.unidadDeMedidaId,
      urlImagen: null,
      tipo: ''
    };
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }
}
