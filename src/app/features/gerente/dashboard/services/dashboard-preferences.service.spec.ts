import { describe, expect, it, beforeEach, vi } from 'vitest';

import { DashboardPreferencesService } from './dashboard-preferences.service';

describe('DashboardPreferencesService', () => {
  let service: DashboardPreferencesService;

  beforeEach(() => {
    localStorage.clear();
    service = new DashboardPreferencesService();
  });

  it('deberia persistir y cargar favoritos desde localStorage', () => {
    const config = [{ id: 'kpi-ventas', width: '25' as const }];

    service.guardarFavoritos(config);

    expect(service.cargarFavoritos()).toEqual(config);
  });

  it('deberia asignar ancho por defecto segun el tipo de widget', () => {
    const conKpi = service.agregar([], 'kpi-ventas');
    const conPanelGrande = service.agregar(conKpi, 'ventas-calendario');
    const conPanelMedio = service.agregar(conPanelGrande, 'proximas-acciones');

    expect(conPanelMedio).toEqual([
      { id: 'kpi-ventas', width: '25' },
      { id: 'ventas-calendario', width: '100' },
      { id: 'proximas-acciones', width: '50' }
    ]);
  });

  it('deberia reordenar sin mutar la configuracion original', () => {
    const config = [
      { id: 'kpi-ventas', width: '25' as const },
      { id: 'kpi-ticket', width: '25' as const }
    ];

    const next = service.reordenar(config, 0, 1);

    expect(next[0].id).toBe('kpi-ticket');
    expect(config[0].id).toBe('kpi-ventas');
  });

  it('deberia ignorar localStorage invalido', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });

    expect(service.cargarFavoritos()).toEqual([]);

    vi.restoreAllMocks();
  });
});
