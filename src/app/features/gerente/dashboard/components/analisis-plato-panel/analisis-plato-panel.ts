import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardStateService } from '../../services/dashboard.state';
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
  private readonly router = inject(Router);
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
    if (destino === 'carta') {
      this.router.navigate(['/staff', 'gerente', 'modificar-carta'], { queryParams: extraParams });
      return;
    }
    const routes: Record<DashboardDestino, string[]> = {
      stock: ['/staff', 'gerente', 'stock-mercaderia'],
      carta: ['/staff', 'gerente', 'modificar-carta'],
      proveedores: ['/staff', 'gerente', 'ver-proveedores'],
      pedido: ['/staff', 'gerente', 'realizar-pedido-sugerido'],
      vencimientos: []
    };
    if (routes[destino]) {
      this.router.navigate(routes[destino], { queryParams: extraParams });
    }
  }
}
