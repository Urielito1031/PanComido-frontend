import { InsumoResponseDto } from '../../../core/models/dtos/responses/insumo.response';
import { DetalleInsumoResponseDto } from '../../../core/models/dtos/responses/detalle-insumo.response';
import { Insumo, InsumoDetalle } from '../../../core/models/domain/insumo';

export function mapInsumoDtoToDomain(dto: InsumoResponseDto): Insumo {
  return {
    id: dto.id,
    nombre: dto.nombre,
    stockActual: dto.stockActual,
    stockMinimo: dto.stockMinimo,
    precioVentaFinal: dto.precioVentaFinal ?? 0,
    esPrecioManual: dto.esPrecioManual,
    esVisibleEnCarta: dto.esVisibleEnCarta,
    costo: dto.costo,
    vencimiento: dto.vencimiento ?? '',
    unidadMedida: { id: 0, nombre: dto.unidadMedida },
    categoriaIngrediente: {
      id: 0,
      descripcion: dto.categoria,
      tipoAplica: dto.tipo
    }
  };
}

export function mapDetalleInsumoDtoToDomain(dto: DetalleInsumoResponseDto): InsumoDetalle {
  return {
    id: dto.id,
    nombre: dto.nombre,
    descripcion: dto.descripcion,
    precioVentaFinal: dto.precioVentaFinal,
    esPrecioManual: dto.esPrecioManual,
    stockMinimo: dto.stockMinimo,
    stockRecomendado: dto.stockRecomendado,
    categoriaId: dto.categoriaId,
    unidadDeMedidaId: dto.unidadDeMedidaId,
    urlImagen: dto.urlImagen,
    tipo: dto.tipo,
    esVisibleEnCarta: dto.esVisibleEnCarta,
    costo: dto.costo
  };
}
