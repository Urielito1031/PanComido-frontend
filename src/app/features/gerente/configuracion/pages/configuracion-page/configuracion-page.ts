import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConfiguracionState } from '../../services/configuracion-state';
import { DatosLocalEditables } from '../../../../../core/models/domain/datos-local';
import { TurnoLaboral } from '../../../../../core/models/domain/turno-laboral';
import { DatosTransferencia, DATOS_TRANSFERENCIA_VACIO } from '../../../../../core/models/domain/datos-transferencia';
import { DatosLocalForm } from "../../components/datos-local-form/datos-local-form";
import { MetodosPagoList } from "../../components/metodos-pago-list/metodos-pago-list";
import { TurnosLaboralesList } from "../../components/turnos-laborales-list/turnos-laborales-list";
import { ComensalPreviewComponent } from "../../components/comensal-preview/comensal-preview";
import { DatosTransferenciaForm } from "../../components/datos-transferencia-form/datos-transferencia-form";
import { Boton } from "../../../../../shared/ui/botones/boton/boton";

@Component({
  selector: 'app-configuracion-page',
  imports: [DatosLocalForm, MetodosPagoList, TurnosLaboralesList, ComensalPreviewComponent, DatosTransferenciaForm, Boton],
  templateUrl: './configuracion-page.html',
  styleUrl: './configuracion-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfiguracionPage {
  readonly state = inject(ConfiguracionState);
  readonly datosLocal = this.state.datosLocal;
  readonly metodosPago = this.state.metodosPago;
  readonly familiasTipograficas = this.state.familiasTipograficas;
  readonly turnos = this.state.turnos;
  readonly filaVirtual = this.state.filaVirtual;
  readonly porcentajes = this.state.porcentajes;
  readonly datosTransferencia = this.state.datosTransferencia;
  readonly datosTransferenciaVacio = DATOS_TRANSFERENCIA_VACIO;
  readonly loading = this.state.loading;
  readonly guardando = this.state.guardando;
  readonly error = this.state.error;
  readonly exito = this.state.exito;

  constructor() {
    this.state.cargarDatos();
  }

  onDatosLocalChange(cambios: Partial<DatosLocalEditables>): void {
    this.state.limpiarFeedback();
    this.state.actualizarDatosLocal(cambios);
  }

  onDatosTransferenciaChange(cambios: Partial<DatosTransferencia>): void {
    this.state.limpiarFeedback();
    this.state.actualizarDatosTransferencia(cambios);
  }

  onToggleMetodoPago(id: number): void {
    this.state.toggleMetodoPago(id);
  }

  onTurnoChange(event: { id: number; cambios: Partial<TurnoLaboral> }): void {
    this.state.limpiarFeedback();
    this.state.actualizarTurno(event.id, event.cambios);
  }
  onToggleFilaVirtual():void{
    this.state.toggleFilaVirtual();
  }
  onPorcentajeItemChange(event: {tipo: 'platos'| 'bebidas'; id: number;porcentaje:number}):void{
    this.state.actualizarPorcentajeItem(event.tipo,event.id,event.porcentaje);
  }

}
