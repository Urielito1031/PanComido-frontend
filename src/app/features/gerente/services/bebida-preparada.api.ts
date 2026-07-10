import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { BebidaPreparada } from '../../../core/models/domain/bebida-preparada';
import { CrearBebidaPreparadaRequestDto } from '../../../core/models/dtos/requests/crear-bebida-preparada.request';
import { ModificarBebidaPreparadaRequestDto } from '../../../core/models/dtos/requests/modificar-bebida-preparada.request';
import { DetalleBebidaPreparadaResponseDto } from '../../../core/models/dtos/responses/detalle-bebida-preparada.response';

interface BebidaPreparadaMutacionResponseDto {
  bebidaPreparada: DetalleBebidaPreparadaResponseDto;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class BebidaPreparadaApiService {
  private api = inject(ApiService);
  private endpoint = 'bebida-preparada';

  getById(id: number): Observable<BebidaPreparada> {
    return this.api.get<DetalleBebidaPreparadaResponseDto>(`${this.endpoint}/${id}`).pipe(
      map(dto => this.mapDetalleToDomain(dto))
    );
  }

  crear(request: CrearBebidaPreparadaRequestDto, imagen: File): Observable<BebidaPreparada> {
    const formData = this.crearAFormData(request, imagen);
    return this.api.post<BebidaPreparadaMutacionResponseDto>(this.endpoint, formData).pipe(
      map(response => this.mapDetalleToDomain(response.bebidaPreparada))
    );
  }

  modificar(id: number, request: ModificarBebidaPreparadaRequestDto, imagen?: File): Observable<BebidaPreparada> {
    const formData = this.modificarAFormData(request, imagen);
    return this.api.put<BebidaPreparadaMutacionResponseDto>(`${this.endpoint}/${id}`, formData).pipe(
      map(response => this.mapDetalleToDomain(response.bebidaPreparada))
    );
  }

  eliminar(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  private crearAFormData(request: CrearBebidaPreparadaRequestDto, imagen: File): FormData {
    const formData = new FormData();
    formData.append('Nombre', request.nombre);
    formData.append('PrecioVentaFinal', request.precioVentaFinal.toString().replace('.', ','));

    if (request.descripcion) {
      formData.append('Descripcion', request.descripcion);
    }
    if (request.esPrecioManual != null) {
      formData.append('EsPrecioManual', request.esPrecioManual ? 'true' : 'false');
    }
    if (request.esVisibleEnCarta != null) {
      formData.append('EsVisibleEnCarta', request.esVisibleEnCarta ? 'true' : 'false');
    }
    request.insumos.forEach((insumo, index) => {
      formData.append(`Insumos[${index}].InsumoId`, insumo.insumoId.toString());
      formData.append(`Insumos[${index}].Cantidad`, insumo.cantidad.toString().replace('.', ','));
    });
    formData.append('imagen', imagen);

    return formData;
  }

  private modificarAFormData(request: ModificarBebidaPreparadaRequestDto, imagen?: File): FormData {
    const formData = new FormData();
    formData.append('Nombre', request.nombre);
    formData.append('PrecioVentaFinal', request.precioVentaFinal.toString().replace('.', ','));

    if (request.descripcion) {
      formData.append('Descripcion', request.descripcion);
    }
    if (request.esPrecioManual != null) {
      formData.append('EsPrecioManual', request.esPrecioManual ? 'true' : 'false');
    }
    if (request.esVisibleEnCarta != null) {
      formData.append('EsVisibleEnCarta', request.esVisibleEnCarta ? 'true' : 'false');
    }
    request.insumos.forEach((insumo, index) => {
      formData.append(`Insumos[${index}].InsumoId`, insumo.insumoId.toString());
      formData.append(`Insumos[${index}].Cantidad`, insumo.cantidad.toString().replace('.', ','));
    });
    if (imagen) {
      formData.append('Imagen', imagen);
    }

    return formData;
  }

  private mapDetalleToDomain(dto: DetalleBebidaPreparadaResponseDto): BebidaPreparada {
    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precioVentaFinal: dto.precioVentaFinal,
      esPrecioManual: dto.esPrecioManual,
      esVisibleEnCarta: dto.esVisibleEnCarta,
      urlImagen: dto.urlImagen,
      categoria: dto.categoria,
      insumos: dto.insumos.map(insumo => ({
        insumoId: insumo.insumoId,
        cantidad: insumo.cantidad,
        nombre: insumo.nombre
      }))
    };
  }
}
