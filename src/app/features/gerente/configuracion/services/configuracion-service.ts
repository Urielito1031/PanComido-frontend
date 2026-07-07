import { inject, Injectable } from '@angular/core';
import { ApiService } from '../../../../core/services/api-service';
import { Observable, catchError, of, throwError } from 'rxjs';
import { DatosLocal } from '../../../../core/models/domain/datos-local';
import {
  ActualizarDatosLocalRequest,
  ActualizarDatosTransferenciaRequest,
  ActualizarFilaVirtualRequest,
  ActualizarMetodoPagoRequest,
  ActualizarPorcentajeGananciaRequest,
  ActualizarTurnoLaboralRequest
} from '../../../../core/models/dtos/requests/configuracion.requests';
import { MetodoPago } from '../../../../core/models/domain/metodo-pago';
import { TurnoLaboral } from '../../../../core/models/domain/turno-laboral';
import { FamiliaTipografica } from '../../../../core/models/domain/familia-tipografica';
import { FilaVirtual } from '../../../../core/models/domain/fila-virtual';
import { PorcentajesGanancia } from '../../../../core/models/domain/porcentajes-ganancia';
import { DatosTransferencia } from '../../../../core/models/domain/datos-transferencia';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionService {
  private api = inject(ApiService);

  private endpoint = "configuracion";

  obtenerDatosLocal(): Observable<DatosLocal> {
    return this.api.get<DatosLocal>(`${this.endpoint}/datos-local`);
  }

  actualizarDatosLocal(datos: DatosLocal, archivo: File | null): Observable<DatosLocal> {
    const formData = datosAFormData(datos, archivo);
    return this.api.put<DatosLocal>(`${this.endpoint}/actualizar-datos`,
      formData
    );
  }
  obtenerMetodosPago(restauranteId?: number): Observable<MetodoPago[]> {
    const url = restauranteId
      ? `${this.endpoint}/metodos-pago/${restauranteId}/comensal`
      : `${this.endpoint}/metodos-pago`;
    return this.api.get<MetodoPago[]>(url);
  }
  actualizarMetodosPago(metodos: MetodoPago[]): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/habilitar-metodos-pago`,
      this.#aRequestMetodosPago(metodos));
  }

  obtenerTurnos(): Observable<TurnoLaboral[]> {
    return this.api.get<TurnoLaboral[]>(`${this.endpoint}/turno`);
  }
  actualizarTurnos(data: TurnoLaboral[]): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/actualizar-turno`,
      this.#aRequestTurnos(data)
    );
  }
  obtenerFamiliasTipograficas(): Observable<FamiliaTipografica[]> {
    return this.api.get<FamiliaTipografica[]>(`${this.endpoint}/familias-tipograficas`);
  }
  obtenerFilaVirtual(): Observable<FilaVirtual> {
    return this.api.get<FilaVirtual>(`${this.endpoint}/fila-virtual`)

  }
  actualizarFilaVirtual(data: FilaVirtual): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/habilitar-fila-virtual`, this.#aRequestFilaVirtual(data));
  }

  obtenerPorcentajes(): Observable<PorcentajesGanancia> {
    return this.api.get<PorcentajesGanancia>(`${this.endpoint}/obtener-porcentajes`);
  }
  actualizarPorcentajes(data: PorcentajesGanancia): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/actualizar-porcentajes`, this.#aRequestPorcentajes(data));
  }

  obtenerDatosTransferencia(): Observable<DatosTransferencia | null> {
    return this.api.get<DatosTransferencia>(`${this.endpoint}/datos-transferencia`).pipe(
      catchError((err) => err.status === 404 ? of(null) : throwError(() => err))
    );
  }
  actualizarDatosTransferencia(datos: DatosTransferencia): Observable<DatosTransferencia> {
    return this.api.put<DatosTransferencia>(`${this.endpoint}/acualizar-datos-transferencia`,
      this.#aRequestDatosTransferencia(datos));
  }
  obtenerDatosTransferenciaComensal(restauranteId: number): Observable<DatosTransferencia | null> {
    return this.api.get<DatosTransferencia>(`${this.endpoint}/datos-transferencia/${restauranteId}/comensal`).pipe(
      catchError((err) => err.status === 404 ? of(null) : throwError(() => err))
    );
  }


  //MAPPERS PRIVADOS
  //viven aca porque es la unica capa quenecesitan saber cómo convertir el domain
  // a contrato de backend. DEBATIR SI VA EN infra/mappers (capa externa);

  #aRequestFilaVirtual(data: FilaVirtual): ActualizarFilaVirtualRequest {
    return { habilitada: data.habilitada }
  }
  #aRequestPorcentajes(data: PorcentajesGanancia): ActualizarPorcentajeGananciaRequest {
    return {
      platos: data.platos.map((p) => ({ id: p.id, porcentaje: p.porcentaje })),
      bebidas: data.bebidas.map((b) => ({ id: b.id, porcentaje: b.porcentaje })),
    }
  }
  #aRequestDatosLocal(datos: DatosLocal): ActualizarDatosLocalRequest {
    return {
      nombre: datos.nombre,
      colorPrincipal: datos.colorPrincipal,
      colorSecundario: datos.colorSecundario,
      familiaTipograficaId: datos.familiaTipograficaId,
      linkResenaGoogleMaps: datos.linkResenaGoogleMaps
    };
  }

  #aRequestDatosTransferencia(datos: DatosTransferencia): ActualizarDatosTransferenciaRequest {
    return {
      alias: datos.alias,
      cbu: datos.cbu,
      numeroCuenta: datos.numeroCuenta,
      titularCuenta: datos.titularCuenta,
    };
  }

  #aRequestMetodosPago(lista: MetodoPago[]): ActualizarMetodoPagoRequest[] {
    return lista.map((m) => (
      {
        id: m.id,
        habilitado: m.habilitado
      })
    );
  }
  #aRequestTurnos(lista: TurnoLaboral[]): ActualizarTurnoLaboralRequest[] {
    return lista.map((t) => ({
      id: t.id,
      horarioInicio: t.horarioInicio,
      horarioFin: t.horarioFin,
      esNocturno: t.esNocturno,
    }))
  }

}
function datosAFormData(datos: DatosLocal, archivo: File | null) {
  const formData = new FormData();
  formData.append('Nombre', datos.nombre);
  formData.append('ColorPrincipal', datos.colorPrincipal || '#000000');
  if (datos.colorSecundario)
    formData.append('ColorSecundario', datos.colorSecundario);
  if (datos.familiaTipograficaId)
    formData.append('FamiliaTipograficaId', datos.familiaTipograficaId.toString());
  if (datos.linkResenaGoogleMaps) {
    formData.append('LinkResenaGoogleMaps', datos.linkResenaGoogleMaps);
  }

  if (archivo) {
    formData.append('imagen', archivo);
  }
  return formData;
}

