import { Injectable, inject, signal } from '@angular/core';
import { ReporteService } from '../../services/reporte.service';

export type EstadoDescarga = 'idle' | 'cargando' | 'error' | 'exito';

@Injectable()
export class ReportesState {
  private readonly reporteService = inject(ReporteService);

  // ── Fechas del selector de rango ──
  readonly fechaDesde = signal<string>('');
  readonly fechaHasta = signal<string>('');

  // ── Estado individual por tipo de reporte ──
  readonly estadoDashboard  = signal<EstadoDescarga>('idle');
  readonly estadoVentas     = signal<EstadoDescarga>('idle');
  readonly estadoPersonal   = signal<EstadoDescarga>('idle');

  // ── Computed helpers ──
  get rangoValido(): boolean {
    if (!this.fechaDesde() || !this.fechaHasta()) return false;
    const desde = new Date(this.fechaDesde());
    const hasta  = new Date(this.fechaHasta());
    const hoy    = new Date();
    hoy.setHours(23, 59, 59, 999);
    
    if (desde > hasta || hasta > hoy) return false;

    const dUTC = Date.UTC(desde.getFullYear(), desde.getMonth(), desde.getDate());
    const hUTC = Date.UTC(hasta.getFullYear(), hasta.getMonth(), hasta.getDate());
    const diffDays = Math.floor((hUTC - dUTC) / (1000 * 60 * 60 * 24));

    return diffDays <= 366;
  }

  setFechaDesde(valor: string): void {
    this.fechaDesde.set(valor);
  }

  setFechaHasta(valor: string): void {
    this.fechaHasta.set(valor);
  }

  descargarDashboard(): void {
    if (!this.rangoValido) return;
    this.estadoDashboard.set('cargando');
    const desde = this.fechaDesde();
    const hasta  = this.fechaHasta();
    this.reporteService.descargarReporteDashboard(desde, hasta).subscribe({
      next: (blob) => {
        this._triggearDescarga(blob, `reporte_ejecutivo_${desde}_a_${hasta}.pdf`);
        this.estadoDashboard.set('exito');
        setTimeout(() => this.estadoDashboard.set('idle'), 3000);
      },
      error: () => {
        this.estadoDashboard.set('error');
        setTimeout(() => this.estadoDashboard.set('idle'), 4000);
      }
    });
  }

  descargarVentas(): void {
    if (!this.rangoValido) return;
    this.estadoVentas.set('cargando');
    const desde = this.fechaDesde();
    const hasta  = this.fechaHasta();
    this.reporteService.descargarReporteVentas(desde, hasta).subscribe({
      next: (blob) => {
        this._triggearDescarga(blob, `reporte_ventas_${desde}_a_${hasta}.pdf`);
        this.estadoVentas.set('exito');
        setTimeout(() => this.estadoVentas.set('idle'), 3000);
      },
      error: () => {
        this.estadoVentas.set('error');
        setTimeout(() => this.estadoVentas.set('idle'), 4000);
      }
    });
  }

  descargarPersonal(): void {
    this.estadoPersonal.set('cargando');
    this.reporteService.descargarReportePersonal().subscribe({
      next: (blob) => {
        const hoy = new Date().toISOString().slice(0, 10);
        this._triggearDescarga(blob, `reporte_personal_${hoy}.pdf`);
        this.estadoPersonal.set('exito');
        setTimeout(() => this.estadoPersonal.set('idle'), 3000);
      },
      error: () => {
        this.estadoPersonal.set('error');
        setTimeout(() => this.estadoPersonal.set('idle'), 4000);
      }
    });
  }

  private _triggearDescarga(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = nombreArchivo;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }
}
