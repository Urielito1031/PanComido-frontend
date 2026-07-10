import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStateService } from '../../services/dashboard.state';
import { DashboardVentaDia } from '../../../../../core/models/domain/dashboard';
import { ArsCurrencyPipe } from '../../../../../shared/pipes/ars-currency.pipe';

@Component({
  selector: 'app-ventas-calendario',
  standalone: true,
  imports: [CommonModule, ArsCurrencyPipe],
  templateUrl: './ventas-calendario.html',
  styleUrls: ['./ventas-calendario.css']
})
export class VentasCalendarioComponent {
  readonly state = inject(DashboardStateService);
  readonly diaSeleccionado = signal<DashboardVentaDia | null>(null);

  readonly desplazamientoCalendario = computed(() => {
    const dias = this.state.ventasCalendarioMes();
    if (dias.length === 0) return [];

    const primeraFechaStr = dias[0].fecha;
    const partes = primeraFechaStr.split('/');
    if (partes.length !== 3) return [];
    const [dia, mes, anio] = partes.map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    const dayOfWeek = fecha.getDay();
    const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    return Array.from({ length: offset });
  });

  readonly mayorVenta = computed(() => {
    return Math.max(...this.state.platosMasVendidos().map(item => item.valor));
  });

  readonly mayorVentaMensual = this.state.maxVentasMensuales;

  readonly mejorDiaMes = computed<DashboardVentaDia | null>(() => {
    return [...this.state.ventasCalendarioMes()].sort((a, b) => b.ventas - a.ventas)[0] ?? null;
  });

  readonly peorDiaMes = computed<DashboardVentaDia | null>(() => {
    return [...this.state.ventasCalendarioMes()].sort((a, b) => a.ventas - b.ventas)[0] ?? null;
  });

  readonly promedioDiaMes = computed(() => {
    const dias = this.state.ventasCalendarioMes();
    if (dias.length === 0) return 0;
    return Math.round(dias.reduce((total, dia) => total + dia.ventas, 0) / dias.length);
  });

  seleccionarDia(item: DashboardVentaDia): void {
    if (this.diaSeleccionado()?.dia === item.dia) {
      this.diaSeleccionado.set(null);
    } else {
      this.diaSeleccionado.set(item);
    }
  }

  cerrarDetalle(): void {
    this.diaSeleccionado.set(null);
  }

  private obtenerPrecioPromedioTicket(): number {
    const ticketStr = this.state.resumenOperativo()?.ticketPromedio ?? '';
    const numeric = Number(ticketStr.replace(/[^0-9]/g, '')) || 0;
    return numeric > 0 ? numeric : 4160;
  }

  calcularPedidosDia(ventas: number): number {
    const avgTicket = this.obtenerPrecioPromedioTicket();
    return Math.max(1, Math.round(ventas / avgTicket));
  }

  calcularTicketPromedioDia(ventas: number): number {
    const avgTicket = this.obtenerPrecioPromedioTicket();
    const shift = (ventas % 15) - 7;
    return avgTicket + shift * 10;
  }

  esMejorDia(item: DashboardVentaDia): boolean {
    return this.mejorDiaMes()?.dia === item.dia;
  }

  esDiaBajo(item: DashboardVentaDia): boolean {
    return item.ventas < this.promedioDiaMes() * 0.78;
  }

  variacionContraPromedio(item: DashboardVentaDia): number {
    const promedio = this.promedioDiaMes();
    if (!promedio) return 0;
    return Math.round(((item.ventas - promedio) / promedio) * 100);
  }

  intensidadVentaDia(valor: number): number {
    const max = this.state.maxVentasCalendarioMes();
    const min = this.peorDiaMes()?.ventas ?? 0;
    if (max <= min) return 0.5;
    return Math.max(0.08, Math.min(1, (valor - min) / (max - min)));
  }

  nivelVentaDia(valor: number): string {
    const intensidad = this.intensidadVentaDia(valor);
    if (intensidad < 0.2) return 'heat-level-1';
    if (intensidad < 0.4) return 'heat-level-2';
    if (intensidad < 0.6) return 'heat-level-3';
    if (intensidad < 0.8) return 'heat-level-4';
    return 'heat-level-5';
  }

  detalleVentaDia(fecha: string, ventas: number): string {
    return `${fecha}: ${new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(ventas)}`;
  }

  porcentajeVentaMensual(valor: number): number {
    const mayor = this.mayorVentaMensual();
    if (!mayor) return 0;
    return Math.max(10, Math.round((valor / mayor) * 100));
  }
}
