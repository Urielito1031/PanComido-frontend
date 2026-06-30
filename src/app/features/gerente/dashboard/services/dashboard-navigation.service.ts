import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardDestino } from '../../../../core/models/domain/dashboard';
import { DashboardStateService } from './dashboard.state';

@Injectable({ providedIn: 'root' })
export class DashboardNavigationService {
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);
  private readonly state = inject(DashboardStateService);

  irA(destino: DashboardDestino, extraParams?: Record<string, unknown>): void {
    if (destino === 'vencimientos') {
      this.state.establecerModoVista('reportes');
      setTimeout(() => this.desplazarAWidget('insumos-vencer', 'start'), 50);
      return;
    }

    if (destino === 'stock') {
      this.router.navigate(['/staff', 'gerente', 'stock-mercaderia'], { fragment: 'lotes' });
      return;
    }

    if (destino === 'carta') {
      this.router.navigate(['/staff', 'gerente', 'modificar-carta'], { queryParams: extraParams });
      return;
    }

    const routes: Record<Exclude<DashboardDestino, 'vencimientos' | 'stock' | 'carta'>, string[]> = {
      proveedores: ['/staff', 'gerente', 'ver-proveedores'],
      pedido: ['/staff', 'gerente', 'realizar-pedido-sugerido']
    };

    this.router.navigate(routes[destino], { queryParams: extraParams });
  }

  desplazarAWidget(widgetId: string, block: ScrollLogicalPosition = 'center'): void {
    const element = this.documento.getElementById('widget-' + widgetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block });
    }
  }
}
