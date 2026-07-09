import { CierreHistorial, CierreTurnoInfo } from '../../../core/models/domain/cierre-caja';
import { CierreHistorialDto, CierreTurnoDto } from '../../../core/models/dtos/responses/cierre-caja.response';

export class CierreCajaMapper {
  static toDomainTurnoInfo(dto: CierreTurnoDto): CierreTurnoInfo {
    const getHorario = (id: number) => {
      if (id === 1) return '07:00 hs a 13:00 hs';
      if (id === 3) return '13:00 hs a 19:30 hs';
      return '19:30 hs a 01:00 hs';
    };

    return {
      fecha: dto.fecha,
      turnoLaboralId: dto.turnoLaboralId,
      nombreTurno: dto.nombreTurno,
      horario: getHorario(dto.turnoLaboralId),
      resumenFinanciero: dto.resumenFinanciero,
      desglosePagos: dto.desglosePagos,
      rendimientoTurno: {
        platosMasVendidos: dto.rendimientoTurno.platosMasVendidos,
        insumosMasUsados: dto.rendimientoTurno.insumosMasUsados
      }
    };
  }

  static toDomainHistorialList(dtos: CierreHistorialDto[]): CierreHistorial[] {
    return dtos.map(dto => ({
      id: dto.id,
      fecha: dto.fecha,
      turno: dto.turno,
      total: dto.total,
      diferencia: dto.diferencia,
      estado: dto.estado
    }));
  }
}
