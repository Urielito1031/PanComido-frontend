import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { DashboardStateService } from '../../services/dashboard.state';

interface SatisfaccionEje {
  label: string;
  valor: number;
  icono: string;
}

interface RadarPoint {
  x: number;
  y: number;
}

@Component({
  selector: 'app-satisfaccion-comensal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './satisfaccion-comensal.html',
  styleUrls: ['./satisfaccion-comensal.css']
})
export class SatisfaccionComensalComponent {
  readonly state = inject(DashboardStateService);

  readonly escalaMaxima = 5;
  readonly centro = 130;
  readonly radioMaximo = 82;
  readonly extensionRadioIconos = 20.5;

  readonly metricas = computed(() => this.state.satisfaccionComensal());

  readonly ejes = computed<SatisfaccionEje[]>(() => {
    const metricas = this.metricas();
    if (!metricas) return [];

    return [
      { label: 'Comida', valor: metricas.promedioComida, icono: 'restaurant' },
      { label: 'Lugar', valor: metricas.promedioLugar, icono: 'storefront' },
      { label: 'Atención', valor: metricas.promedioAtencion, icono: 'support_agent' }
    ];
  });

  readonly tieneEncuestas = computed(() => (this.metricas()?.totalEncuestas ?? 0) > 0);
  readonly radarPoints = computed(() => this.ejes().map((eje, index) => this.obtenerPunto(eje.valor, index)));
  readonly radarPolygon = computed(() => this.radarPoints().map(point => `${point.x},${point.y}`).join(' '));
  readonly fullScalePolygon = computed(() => this.ejes().map((_eje, index) => this.obtenerPunto(this.escalaMaxima, index)).map(point => `${point.x},${point.y}`).join(' '));
  readonly promedioGeneral = computed(() => {
    const ejes = this.ejes();
    if (ejes.length === 0) return 0;
    return ejes.reduce((total, eje) => total + this.normalizarValor(eje.valor), 0) / ejes.length;
  });

  readonly maxValor = computed(() => {
    const ejes = this.ejes();
    if (ejes.length === 0) return -1;
    return Math.max(...ejes.map(e => e.valor));
  });

  readonly minValor = computed(() => {
    const ejes = this.ejes();
    if (ejes.length === 0) return 6;
    return Math.min(...ejes.map(e => e.valor));
  });

  normalizarValor(valor: number): number {
    return Math.max(0, Math.min(this.escalaMaxima, valor));
  }

  obtenerRadio(valor: number): number {
    return (this.normalizarValor(valor) / this.escalaMaxima) * this.radioMaximo;
  }

  obtenerPunto(valor: number, index: number): RadarPoint {
    return this.puntoDesdeRadio(this.obtenerRadio(valor), index);
  }

  obtenerPuntoIcono(index: number): RadarPoint {
    return this.puntoDesdeRadio(this.radioMaximo + this.extensionRadioIconos, index);
  }

  private puntoDesdeRadio(radio: number, index: number): RadarPoint {
    const totalEjes = Math.max(this.ejes().length, 3);
    const angulo = (-90 + (360 / totalEjes) * index) * (Math.PI / 180);

    return {
      x: Math.round((this.centro + Math.cos(angulo) * radio) * 100) / 100,
      y: Math.round((this.centro + Math.sin(angulo) * radio) * 100) / 100
    };
  }

  formatoPromedio(valor: number): string {
    return this.normalizarValor(valor).toFixed(1);
  }

  formatoPorcentaje(valor: number): string {
    return `${Math.round(valor * 10) / 10}%`;
  }

  tonoDerivacion(): 'success' | 'warning' | 'low' {
    const porcentaje = this.metricas()?.porcentajeDerivados ?? 0;
    if (porcentaje >= 40) return 'success';
    if (porcentaje >= 20) return 'warning';
    return 'low';
  }
}
