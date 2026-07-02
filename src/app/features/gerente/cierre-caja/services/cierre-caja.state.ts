import { Injectable, computed, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CierreCajaApiService } from './cierre-caja.api';
import { CierreCajaMapper } from '../../../../infra/http/mappers/cierre-caja.mapper';
import { CierreHistorial, CierreTurnoInfo } from '../../../../core/models/domain/cierre-caja';
import { environment } from '../../../../../environments/environment';
import { BrowserNavigationService } from '../../../../core/services/browser-navigation.service';

@Injectable({
  providedIn: 'root'
})
export class CierreCajaStateService {
  private api = inject(CierreCajaApiService);
  private destroyRef = inject(DestroyRef);
  private browserNavigation = inject(BrowserNavigationService);

  // Signals
  private _datosTurno = signal<CierreTurnoInfo | null>(null);
  private _historial = signal<CierreHistorial[]>([]);
  private _loading = signal<boolean>(false);
  private _efectivoContado = signal<number>(0);
  private _observacion = signal<string>('');
  private _cierreConfirmado = signal<boolean>(false);
  private _cierreSeleccionadoId = signal<number | null>(null);
  
  // Shift selection & details modals signals
  private _turnoIdSeleccionado = signal<number>(2);
  private _cierreDetalle = signal<CierreHistorial | null>(null);
  private _mostrarConfirmacion = signal<boolean>(false);
  
  // Platos details modal signals
  private _modalPlatosTipo = signal<'mas' | 'menos' | null>(null);
  private _mostrarEncuestasDetalle = signal<boolean>(false);

  // Public Computed
  public datosTurno = computed(() => this._datosTurno());
  public historial = computed(() => this._historial());
  public loading = computed(() => this._loading());
  public efectivoContado = computed(() => this._efectivoContado());
  public observacion = computed(() => this._observacion());
  public cierreConfirmado = computed(() => this._cierreConfirmado());
  public cierreSeleccionadoId = computed(() => this._cierreSeleccionadoId());
  
  public turnoIdSeleccionado = computed(() => this._turnoIdSeleccionado());
  public cierreDetalle = computed(() => this._cierreDetalle());
  public mostrarConfirmacion = computed(() => this._mostrarConfirmacion());
  public modalPlatosTipo = computed(() => this._modalPlatosTipo());
  public mostrarEncuestasDetalle = computed(() => this._mostrarEncuestasDetalle());

  public efectivoEsperado = computed(() => {
    const turno = this._datosTurno();
    return turno ? turno.resumenFinanciero.efectivoEsperado : 0;
  });

  public diferencia = computed(() => {
    const esperado = this.efectivoEsperado();
    const contado = this._efectivoContado();
    return contado - esperado;
  });

  // Actions
  cambiarTurnoId(id: number): void {
    this._turnoIdSeleccionado.set(id);
    this.cargarDatos();
  }

  abrirConfirmacion(): void {
    this._mostrarConfirmacion.set(true);
  }

  cerrarConfirmacion(): void {
    this._mostrarConfirmacion.set(false);
  }

  abrirDetalleCierre(cierre: CierreHistorial): void {
    this._cierreDetalle.set(cierre);
  }

  cerrarDetalleCierre(): void {
    this._cierreDetalle.set(null);
  }

  abrirModalPlatos(tipo: 'mas' | 'menos'): void {
    this._modalPlatosTipo.set(tipo);
  }

  cerrarModalPlatos(): void {
    this._modalPlatosTipo.set(null);
  }

  abrirEncuestasDetalle(): void {
    this._mostrarEncuestasDetalle.set(true);
  }

  cerrarEncuestasDetalle(): void {
    this._mostrarEncuestasDetalle.set(false);
  }

  cargarDatos(): void {
    this._loading.set(true);
    
    // Cargar Turno Actual
    this.api.getTurno()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => {
          const domainData = CierreCajaMapper.toDomainTurnoInfo(dto);
          this._datosTurno.set(domainData);
          this._efectivoContado.set(domainData.resumenFinanciero.efectivoEsperado);
          this._loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando turno:', err);
          this._loading.set(false);
        }
      });

    // Cargar Historial
    this.api.getHistorial()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dtos) => {
          this._historial.set(CierreCajaMapper.toDomainHistorialList(dtos));
        },
        error: (err) => {
          console.error('Error cargando historial:', err);
        }
      });
  }

  setEfectivoContado(valor: number): void {
    this._efectivoContado.set(valor);
  }

  setObservacion(valor: string): void {
    this._observacion.set(valor);
  }

  confirmarCierre(): void {
    const turno = this._datosTurno();
    if (!turno) return;

    this._loading.set(true);
    this._mostrarConfirmacion.set(false); // Close confirmation modal

    const dif = this.diferencia();
    const sobrante = dif > 0 ? dif : 0;
    
    this.api.postCierre({
      restauranteId: 1, // default
      turnoLaboralId: turno.turnoLaboralId,
      efectivoContado: this.efectivoContado(),
      diferencia: dif,
      sobrante: sobrante,
      observacion: this.observacion()
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (res) => {
        this._cierreConfirmado.set(true);
        this._cierreSeleccionadoId.set(res.cierreId);
        this.cargarDatos(); // Refresh historial
      },
      error: (err) => {
        console.error('Error al confirmar cierre:', err);
        this._loading.set(false);
      },
      complete: () => {
        this._loading.set(false);
      }
    });
  }

  imprimirReporte(id?: number): void {
    const cierreId = id || this._cierreSeleccionadoId();
    if (cierreId) {
      this.browserNavigation.abrirEnNuevaPestana(`${environment.apiUrl}/api/cierre/${cierreId}/reporte-pdf`);
    }
  }
}
