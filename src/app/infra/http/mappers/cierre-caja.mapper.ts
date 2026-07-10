import { CierreCaja } from '../../../core/models/domain/cierre-caja';
import { CierreCajaDto } from '../../../core/models/dtos/responses/cierre-caja.response';

export class CierreCajaMapper {
  static toDomain(dto: CierreCajaDto): CierreCaja {
    return {
      fecha: dto.fecha,
      turnoLaboralId: dto.turnoLaboralId,
      turnoLaboralNombre: dto.turnoLaboralNombre,
      cantidadTotalDePagos: dto.cantidadTotalDePagos,
      totalRecaudado: dto.totalRecaudado,
      detallePagos: dto.detallePagos,
      diferencia: dto.diferencia,
      sobrante: dto.sobrante
    };
  }

  static toDomainList(dtos: CierreCajaDto[]): CierreCaja[] {
    return dtos.map(CierreCajaMapper.toDomain);
  }
}
