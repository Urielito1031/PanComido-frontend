import { Injectable } from '@angular/core';

import { FavoriteWidgetConfig } from '../../../../core/models/domain/dashboard';

export const FAVORITOS_POR_DEFECTO: FavoriteWidgetConfig[] = [
  { id: 'kpi-ventas', width: '25' },
  { id: 'kpi-pedidos', width: '25' },
  { id: 'kpi-ticket', width: '25' },
  { id: 'kpi-promedio', width: '25' },
  { id: 'ventas-calendario', width: '100' }
];

export const PLANTILLA_FINANCIERA: FavoriteWidgetConfig[] = [
  { id: 'kpi-ventas', width: '25' },
  { id: 'kpi-ticket', width: '25' },
  { id: 'kpi-promedio', width: '25' },
  { id: 'kpi-pedidos', width: '25' },
  { id: 'ventas-calendario', width: '100' }
];

export const PLANTILLA_OPERATIVA: FavoriteWidgetConfig[] = [
  { id: 'insumos-vencer', width: '100' },
  { id: 'radar-alergias', width: '50' },
  { id: 'kpi-pedidos', width: '25' },
  { id: 'kpi-promedio', width: '25' }
];

export const PLANTILLA_PERSONAL: FavoriteWidgetConfig[] = [
  { id: 'mozos', width: '100' },
  { id: 'satisfaccion-comensal', width: '100' },
  { id: 'kpi-pedidos', width: '50' },
  { id: 'radar-alergias', width: '50' }
];

type WidgetWidth = FavoriteWidgetConfig['width'];
const WIDGETS_OBSOLETOS = new Set(['lectura-comercial', 'lectura-0', 'lectura-1', 'lectura-2']);

@Injectable({ providedIn: 'root' })
export class DashboardPreferencesService {
  private readonly storageKey = 'dashboard_favorites_config';

  cargarFavoritos(): FavoriteWidgetConfig[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return this.filtrarObsoletos(JSON.parse(saved) as FavoriteWidgetConfig[]);
      }
    } catch (e) {}
    return [];
  }

  guardarFavoritos(config: FavoriteWidgetConfig[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.filtrarObsoletos(config)));
    } catch (e) {}
  }

  agregar(config: FavoriteWidgetConfig[], id: string, width?: WidgetWidth): FavoriteWidgetConfig[] {
    if (this.esFavorito(config, id)) return config;
    return [...config, { id, width: width ?? this.obtenerAnchoPorDefecto(id) }];
  }

  insertarEn(config: FavoriteWidgetConfig[], id: string, index: number, width?: WidgetWidth): FavoriteWidgetConfig[] {
    if (this.esFavorito(config, id)) return config;
    const next = [...config];
    next.splice(index, 0, { id, width: width ?? this.obtenerAnchoPorDefecto(id) });
    return next;
  }

  quitar(config: FavoriteWidgetConfig[], id: string): FavoriteWidgetConfig[] {
    return config.filter(w => w.id !== id);
  }

  actualizarAncho(config: FavoriteWidgetConfig[], id: string, width: WidgetWidth): FavoriteWidgetConfig[] {
    return config.map(w => w.id === id ? { ...w, width } : w);
  }

  reordenar(config: FavoriteWidgetConfig[], fromIndex: number, toIndex: number): FavoriteWidgetConfig[] {
    if (fromIndex < 0 || fromIndex >= config.length || toIndex < 0 || toIndex >= config.length) {
      return config;
    }
    const next = [...config];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  }

  toggle(config: FavoriteWidgetConfig[], id: string): FavoriteWidgetConfig[] {
    if (this.esFavorito(config, id)) {
      return this.quitar(config, id);
    }
    return this.agregar(config, id);
  }

  aplicarPreset(tipo: 'financiero' | 'operativo' | 'personal'): FavoriteWidgetConfig[] {
    if (tipo === 'financiero') return [...PLANTILLA_FINANCIERA];
    if (tipo === 'operativo') return [...PLANTILLA_OPERATIVA];
    return [...PLANTILLA_PERSONAL];
  }

  favoritosPorDefecto(): FavoriteWidgetConfig[] {
    return [...FAVORITOS_POR_DEFECTO];
  }

  esFavorito(config: FavoriteWidgetConfig[], id: string): boolean {
    return config.some(w => w.id === id);
  }

  private obtenerAnchoPorDefecto(id: string): WidgetWidth {
    if (id.startsWith('kpi-')) return '25';
    if (id === 'ventas-calendario' || id === 'mozos' || id === 'insumos-vencer' || id === 'satisfaccion-comensal') {
      return '100';
    }
    return '50';
  }

  private filtrarObsoletos(config: FavoriteWidgetConfig[]): FavoriteWidgetConfig[] {
    return config.filter(widget => !WIDGETS_OBSOLETOS.has(widget.id));
  }
}
