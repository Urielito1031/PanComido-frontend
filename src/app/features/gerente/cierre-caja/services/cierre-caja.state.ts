import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { CierreCajaApiService } from './cierre-caja.api';
import { CierreCajaMapper } from '../../../../infra/http/mappers/cierre-caja.mapper';
import { CierreCaja } from '../../../../core/models/domain/cierre-caja';
import { ConfiguracionService } from '../../configuracion/services/configuracion-service';
import { TurnoLaboral } from '../../../../core/models/domain/turno-laboral';

export type TipoTurnoCierre = 'dia' | 'noche';

@Injectable({
  providedIn: 'root'
})
export class CierreCajaStateService {
  private api = inject(CierreCajaApiService);
  private configuracionApi = inject(ConfiguracionService);
  private destroyRef = inject(DestroyRef);

  // Signals
  private _turnos = signal<TurnoLaboral[]>([]);
  private _historial = signal<CierreCaja[]>([]);
  private _cierreGenerado = signal<CierreCaja | null>(null);
  private _cierreDetalle = signal<CierreCaja | null>(null);
  private _turnoSeleccionado = signal<TipoTurnoCierre | null>(null);
  private _conteoCaja = signal<number>(0);
  private _loading = signal<boolean>(false);
  private _generando = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Public Computed
  public historial = computed(() => this._historial());
  public cierreGenerado = computed(() => this._cierreGenerado());
  public cierreDetalle = computed(() => this._cierreDetalle());
  public turnoSeleccionado = computed(() => this._turnoSeleccionado());
  public conteoCaja = computed(() => this._conteoCaja());
  public loading = computed(() => this._loading());
  public generando = computed(() => this._generando());
  public error = computed(() => this._error());

  public turnoDiaId = computed(() => this._turnos().find(t => !t.esNocturno)?.id ?? null);
  public turnoNocheId = computed(() => this._turnos().find(t => t.esNocturno)?.id ?? null);

  // Actions
  cargarDatos(): void {
    this._loading.set(true);
    this._error.set(null);

    forkJoin({
      turnos: this.configuracionApi.obtenerTurnos(),
      historial: this.api.getHistorial()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ turnos, historial }) => {
          this._turnos.set(turnos);
          this._historial.set(CierreCajaMapper.toDomainList(historial));
          this._loading.set(false);
        },
        error: () => {
          this._loading.set(false);
          this._error.set('No se pudieron cargar los datos de cierre de caja.');
        }
      });
  }

  abrirCierre(tipo: TipoTurnoCierre): void {
    this._turnoSeleccionado.set(tipo);
    this._conteoCaja.set(0);
    this._error.set(null);
  }

  cerrarModalCierre(): void {
    this._turnoSeleccionado.set(null);
  }

  setConteoCaja(valor: number): void {
    this._conteoCaja.set(valor);
  }

  confirmarCierre(): void {
    const tipo = this._turnoSeleccionado();
    const idTurnoLaboral = tipo === 'dia' ? this.turnoDiaId() : this.turnoNocheId();
    if (!tipo || !idTurnoLaboral) return;

    this._generando.set(true);
    this._error.set(null);

    this.api.generarCierre({ idTurnoLaboral, conteoCaja: this._conteoCaja() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => {
          this._cierreGenerado.set(CierreCajaMapper.toDomain(dto));
          this._turnoSeleccionado.set(null);
          this._generando.set(false);
          this.cargarHistorial();
        },
        error: (err) => {
          this._generando.set(false);
          if (err.status === 409) {
            this._error.set(err.error?.mensaje || 'El turno todavía está en curso, no se puede cerrar todavía.');
          } else if (err.status === 404) {
            this._error.set(err.error?.mensaje || 'No se encontró el turno.');
          } else {
            this._error.set(err.error?.mensaje || 'No se pudo generar el cierre de caja. Intentá nuevamente.');
          }
        }
      });
  }

  abrirDetalleCierre(cierre: CierreCaja): void {
    this._cierreDetalle.set(cierre);
  }

  cerrarDetalleCierre(): void {
    this._cierreDetalle.set(null);
  }

  private cargarHistorial(): void {
    this.api.getHistorial()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dtos) => this._historial.set(CierreCajaMapper.toDomainList(dtos)),
        error: () => {}
      });
  }
}
