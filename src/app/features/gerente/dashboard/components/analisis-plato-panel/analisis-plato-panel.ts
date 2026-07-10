import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';
import { DashboardNavigationService } from '../../services/dashboard-navigation.service';
import { DashboardDestino } from '../../../../../core/models/domain/dashboard';

@Component({
  selector: 'app-analisis-plato-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analisis-plato-panel.html',
  styleUrls: ['./analisis-plato-panel.css']
})
export class AnalisisPlatoPanelComponent {
  readonly state = inject(DashboardStateService);
  private readonly navigation = inject(DashboardNavigationService);
  readonly confirmandoDescuento = signal<boolean>(false);

  cerrarDetallePlato(): void {
    this.confirmandoDescuento.set(false);
    this.state.cerrarDetallePlato();
  }

  confirmarDescuento(platoNombre: string): void {
    this.state.aplicarDescuentoDirecto(platoNombre);
    this.confirmandoDescuento.set(false);
  }

  agendarRecordatorio(platoNombre: string, accionTitulo: string): void {
    this.state.agendarRecordatorioDirecto(platoNombre, accionTitulo);
  }

  obtenerPuntosSparkline(tendencia: number[]): string {
    if (!tendencia || tendencia.length === 0) return '';
    const minVal = Math.min(...tendencia);
    const maxVal = Math.max(...tendencia);
    const range = maxVal - minVal || 1;

    const svgW = 320;
    const svgH = 60;
    const padding = 6;
    const chartH = svgH - padding * 2;

    return tendencia.map((val, idx) => {
      const x = padding + (idx * (svgW - padding * 2)) / (tendencia.length - 1);
      const y = padding + chartH - ((val - minVal) / range) * chartH;
      return `${x},${y}`;
    }).join(' ');
  }

  obtenerArrayPuntosSparkline(tendencia: number[]): { x: number; y: number }[] {
    if (!tendencia || tendencia.length === 0) return [];
    const minVal = Math.min(...tendencia);
    const maxVal = Math.max(...tendencia);
    const range = maxVal - minVal || 1;

    const svgW = 320;
    const svgH = 60;
    const padding = 6;
    const chartH = svgH - padding * 2;

    return tendencia.map((val, idx) => {
      const x = padding + (idx * (svgW - padding * 2)) / (tendencia.length - 1);
      const y = padding + chartH - ((val - minVal) / range) * chartH;
      return { x, y };
    });
  }

  irA(destino: DashboardDestino, extraParams?: any): void {
    this.navigation.irA(destino, extraParams);
  }
}
