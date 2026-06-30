import { Component, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardStateService } from '../../services/dashboard.state';
import { DashboardDestino } from '../../../../../core/models/domain/dashboard';

@Component({
  selector: 'app-proximas-acciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './proximas-acciones.html',
  styleUrls: ['./proximas-acciones.css']
})
export class ProximasAccionesComponent {
  readonly state = inject(DashboardStateService);
  private readonly router = inject(Router);
  private readonly documento = inject(DOCUMENT);

  obtenerIconoAccion(destino: string): string {
    switch (destino) {
      case 'pedido': return 'local_shipping';
      case 'stock': return 'inventory_2';
      case 'carta': return 'restaurant_menu';
      default: return 'task_alt';
    }
  }

  irA(destino: DashboardDestino, extraParams?: any): void {
    if (destino === 'vencimientos') {
      this.state.establecerModoVista('reportes');
      setTimeout(() => {
        const element = this.documento.getElementById('widget-insumos-vencer');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
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

    const routes: Record<DashboardDestino, string[]> = {
      stock: ['/staff', 'gerente', 'stock-mercaderia'],
      carta: ['/staff', 'gerente', 'modificar-carta'],
      proveedores: ['/staff', 'gerente', 'ver-proveedores'],
      pedido: ['/staff', 'gerente', 'realizar-pedido-sugerido'],
      vencimientos: []
    };

    this.router.navigate(routes[destino], { queryParams: extraParams });
  }
}
