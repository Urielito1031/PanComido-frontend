import { Injectable, inject } from '@angular/core';
import { forkJoin, map, switchMap, Observable, of, delay } from 'rxjs';
import { ApiService } from '../../../core/services/api-service';
import { Plato } from '../../../core/models/domain/plato';
import { Insumo } from '../../../core/models/domain/insumo';
import { InsumoResponseDto } from '../../../core/models/dtos/responses/insumo.response';
import { CrearPlatoIngredienteDto, CrearPlatoRequestDto } from '../../../core/models/dtos/requests/crear-plato.request';
import { mapInsumoDtoToDomain } from '../../../infra/http/mappers/insumo.mapper';
import { PorcentajesGanancia } from '../../../core/models/domain/porcentajes-ganancia';
import { calcularCostoReceta, calcularPrecioConGanancia } from './plato-cost';

export interface ItemDesplegableDto {
  id: number;
  descripcion: string;
}

export interface IngredienteDisponibleDto {
  id: number;
  nombre: string;
  unidadMedida: string;
  costoUnitario: number;
}

export interface DatosFormularioCrearPlatoResponseDto {
  tiposPlato: ItemDesplegableDto[];
  categoriasPlato: ItemDesplegableDto[];
  restricciones: ItemDesplegableDto[];
  ingredientes: IngredienteDisponibleDto[];
  porcentajes: PorcentajesGanancia;
}

export interface ModificarPlatoRequestDto {
  nombre: string;
  descripcion: string;
  precioVentaFinal: number;
  tiempoPreparacionBase: number;
  esPrecioManual: boolean;
  tipoPlatoId: number;
  categoriaPlatoId: number;
  urlImagen: string;
  esVisibleEnCarta: boolean;
  restriccionesIds: number[];
  ingredientes: CrearPlatoIngredienteDto[];
}

interface DetallePlatoResponseDto {
  id: number;
  nombre: string;
  descripcion: string;
  precioVentaFinal: number;
  tiempoPreparacionBase: number;
  esPrecioManual: boolean;
  tipoPlatoId: number;
  categoriaPlatoId: number;
  urlImagen: string | null;
  esVisibleEnCarta: boolean;
  restriccionesIds: number[];
  ingredientes: CrearPlatoIngredienteDto[];
}

interface PlatoArticuloBackend {
  articuloId: number;
  nombre: string;
  precioVentaFinal: number;
  costo: number;
  visibleEnCarta: boolean;
  urlImagen: string | null;
  tipoArticulo: string;
  categoria: string;
  categoriaPlatoId?: number | null;
  categoriaInsumoId?: number | null;
  destacado?: boolean;
  esPrecioManual?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PlatoApiService {
  private api = inject(ApiService);
  private endpoint = 'plato';

  getDatosFormulario(): Observable<DatosFormularioCrearPlatoResponseDto> {
    return this.api.get<DatosFormularioCrearPlatoResponseDto>(`${this.endpoint}/formulario-plato`);
  }

  crearPlato(request: CrearPlatoRequestDto, archivo: File): Observable<Plato> {
    const formData = this.platoAFormData(request,archivo);
    return this.api.post<Plato>(this.endpoint, formData);
  }
  platoAFormData(plato: CrearPlatoRequestDto, archivo: File):FormData {
    const formData= new FormData();
    formData.append('Nombre',plato.nombre);
    formData.append('PrecioVentaFinal',plato.precioVentaFinal.toString().replace('.', ','));
    formData.append('TiempoPreparacionBase',plato.tiempoPreparacionBase.toString());
    formData.append('TipoPlatoId', plato.tipoPlatoId.toString());
    formData.append('CategoriaPlatoId',plato.categoriaPlatoId.toString());
    formData.append('EsPrecioManual', plato.esPrecioManual ? 'true' : 'false');

    if(plato.descripcion){
      formData.append('Descripcion',plato.descripcion);
    }
    if (plato.restriccionesIds && plato.restriccionesIds.length > 0) {
      plato.restriccionesIds.forEach((id, index) => {
        formData.append(`RestriccionesIds[${index}]`, id.toString());
       });
      }
      if (plato.ingredientes && plato.ingredientes.length > 0) {
        plato.ingredientes.forEach((ingrediente, index) => {
          formData.append(`Ingredientes[${index}].InsumoId`, ingrediente.insumoId.toString());
          formData.append(`Ingredientes[${index}].Cantidad`, ingrediente.cantidad.toString().replace('.', ','));
          formData.append(`Ingredientes[${index}].Opcional`, ingrediente.opcional ? 'true' : 'false');
          });
        }
        formData.append('imagen', archivo);
        return formData;
  }

  getPlatos(): Observable<Plato[]> {
    return this.api.get<PlatoArticuloBackend[]>('carta/obtener-articulos').pipe(
      map(articulos => articulos.map(dto => ({
        id: dto.articuloId,
        nombre: dto.nombre,
        precioVenta: dto.precioVentaFinal,
        costo: dto.costo,
        visible: dto.visibleEnCarta,
        imagen: dto.urlImagen || '',
        tipo: dto.tipoArticulo,
        categoria: dto.categoria,
        categoriaPlatoId: dto.categoriaPlatoId ?? undefined,
        categoriaInsumoId: dto.categoriaInsumoId ?? undefined,
        recomendado: dto.destacado ?? false,
        esPrecioManual: dto.esPrecioManual ?? false
      })))
    );
  }

  getPlatoById(id: number): Observable<Plato> {
    return forkJoin({
      detalle: this.api.get<DetallePlatoResponseDto>(`${this.endpoint}/${id}`),
      formulario: this.getDatosFormulario()
    }).pipe(
      map(({ detalle, formulario }) => this.mapDetalleToDomain(detalle, formulario))
    );
  }

  getInsumos(): Observable<Insumo[]> {
    return this.api.get<InsumoResponseDto[]>('Insumo').pipe(
      map(insumos => insumos.map(mapInsumoDtoToDomain))
    );
  }

  modificarPlato(id: number, request: ModificarPlatoRequestDto): Observable<Plato> {
    return this.api.put<{ mensaje: string }>(`${this.endpoint}/${id}`, request).pipe(
      map(() => this.mapModificarRequestToDomain(id, request))
    );
  }

  recalcularPrecioAutomatico(platoId: number, porcentajeGanancia: number): Observable<Plato> {
    return this.getPlatoById(platoId).pipe(
      switchMap(detalle => {
        const costo = calcularCostoReceta(detalle.receta ?? []);
        const request: ModificarPlatoRequestDto = {
          nombre: detalle.nombre,
          descripcion: detalle.descripcion ?? '',
          precioVentaFinal: calcularPrecioConGanancia(costo, porcentajeGanancia),
          tiempoPreparacionBase: detalle.tiempoPreparacion ?? detalle.tiempo ?? 1,
          esPrecioManual: false,
          tipoPlatoId: detalle.tipoPlatoId!,
          categoriaPlatoId: detalle.categoriaPlatoId!,
          urlImagen: detalle.imagen,
          esVisibleEnCarta: detalle.visible,
          restriccionesIds: detalle.restriccionesIds ?? [],
          ingredientes: (detalle.receta ?? []).map(ingrediente => ({
            insumoId: Number(ingrediente.id),
            cantidad: ingrediente.cantidad,
            opcional: ingrediente.opcional ?? false
          }))
        };
        return this.modificarPlato(platoId, request);
      })
    );
  }

  updatePlato(id: number, data: Partial<Plato>): Observable<Plato> {
    const payload: Record<string, unknown> = { ...data };
    if (data.visible !== undefined) {
      payload['visibleEnCarta'] = data.visible;
      delete payload['visible'];
    }
    if (data.precioVenta !== undefined) {
      payload['precioVentaFinal'] = data.precioVenta;
      delete payload['precioVenta'];
    }
    if (data.imagen !== undefined) {
      payload['urlImagen'] = data.imagen;
      delete payload['imagen'];
    }
    if (data.recomendado !== undefined) {
      payload['destacado'] = data.recomendado;
      delete payload['recomendado'];
    }

    return this.api.patch<PlatoArticuloBackend>(`carta/articulos/${id}`, payload).pipe(
      map(dto => {
        const result: Partial<Plato> = { ...data };
        if (dto) {
          if (dto.articuloId !== undefined) result.id = dto.articuloId;
          if (dto.nombre !== undefined) result.nombre = dto.nombre;
          if (dto.precioVentaFinal !== undefined) result.precioVenta = dto.precioVentaFinal;
          if (dto.costo !== undefined) result.costo = dto.costo;
          if (dto.visibleEnCarta !== undefined) result.visible = dto.visibleEnCarta;
          if (dto.urlImagen !== undefined) result.imagen = dto.urlImagen || '';
          if (dto.tipoArticulo !== undefined) result.tipo = dto.tipoArticulo;
          if (dto.categoria !== undefined) result.categoria = dto.categoria;
          if (dto.destacado !== undefined) result.recomendado = dto.destacado;
        }
        return result as Plato;
      })
    );
  }

  deletePlato(id: number): Observable<boolean> {
    return this.api.delete<boolean>(`${this.endpoint}/${id}`);
  }

  getPlatosEliminados(): Observable<Plato[]> {
    // MOCK: Endpoint simulado "Api-First"
    return of([
      {
        id: 9991,
        nombre: 'Hamburguesa Triple Clásica',
        descripcion: 'Plato eliminado temporalmente',
        precioVenta: 8500,
        costo: 3000,
        tiempo: 15,
        tiempoPreparacion: 15,
        tipoPlatoId: 1,
        categoriaPlatoId: 1,
        tipo: 'Principal',
        categoria: 'Hamburguesas',
        restriccionesIds: [],
        visible: false,
        imagen: '',
        receta: []
      },
      {
        id: 9992,
        nombre: 'Ensalada César Antigua',
        descripcion: 'Eliminada por falta de insumos',
        precioVenta: 4200,
        costo: 1500,
        tiempo: 10,
        tiempoPreparacion: 10,
        tipoPlatoId: 1,
        categoriaPlatoId: 2,
        tipo: 'Principal',
        categoria: 'Ensaladas',
        restriccionesIds: [],
        visible: false,
        imagen: '',
        receta: []
      }
    ]).pipe(delay(600));
  }

  restaurarPlato(id: number): Observable<boolean> {
    // MOCK: Simulamos el PATCH /plato/{id}/restaurar
    return of(true).pipe(delay(400));
  }

  private mapDetalleToDomain(dto: DetallePlatoResponseDto, formulario: DatosFormularioCrearPlatoResponseDto): Plato {
    const tipo = formulario.tiposPlato.find(item => item.id === dto.tipoPlatoId)?.descripcion ?? '';
    const categoria = formulario.categoriasPlato.find(item => item.id === dto.categoriaPlatoId)?.descripcion ?? '';
    const ingredientes = dto.ingredientes ?? [];

    return {
      id: dto.id,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      precioVenta: dto.precioVentaFinal,
      costo: 0,
      tiempo: dto.tiempoPreparacionBase,
      tiempoPreparacion: dto.tiempoPreparacionBase,
      tipoPlatoId: dto.tipoPlatoId,
      categoriaPlatoId: dto.categoriaPlatoId,
      esPrecioManual: dto.esPrecioManual,
      tipo,
      categoria,
      restriccionesIds: dto.restriccionesIds ?? [],
      visible: dto.esVisibleEnCarta,
      imagen: dto.urlImagen || '',
      receta: ingredientes.map(ingrediente => {
        const insumo = formulario.ingredientes.find(item => item.id === ingrediente.insumoId);
        return {
          id: ingrediente.insumoId,
          nombre: insumo?.nombre ?? `Insumo ${ingrediente.insumoId}`,
          cantidad: ingrediente.cantidad,
          unidadMedida: insumo?.unidadMedida ?? '',
          costoUnitario: insumo?.costoUnitario ?? 0,
          opcional: ingrediente.opcional
        };
      })
    };
  }

  private mapModificarRequestToDomain(id: number, request: ModificarPlatoRequestDto): Plato {
    return {
      id,
      nombre: request.nombre,
      descripcion: request.descripcion,
      precioVenta: request.precioVentaFinal,
      costo: 0,
      tiempo: request.tiempoPreparacionBase,
      tiempoPreparacion: request.tiempoPreparacionBase,
      tipoPlatoId: request.tipoPlatoId,
      categoriaPlatoId: request.categoriaPlatoId,
      esPrecioManual: request.esPrecioManual,
      tipo: '',
      categoria: '',
      restriccionesIds: request.restriccionesIds,
      visible: request.esVisibleEnCarta,
      imagen: request.urlImagen,
      receta: request.ingredientes.map(ingrediente => ({
        id: ingrediente.insumoId,
        nombre: '',
        cantidad: ingrediente.cantidad,
        unidadMedida: '',
        costoUnitario: 0,
        opcional: ingrediente.opcional
      }))
    };
  }
}
