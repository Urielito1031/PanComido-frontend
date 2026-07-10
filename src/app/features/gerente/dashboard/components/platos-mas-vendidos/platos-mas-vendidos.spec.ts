import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStateService } from '../../services/dashboard.state';
import { PlatosMasVendidosComponent } from './platos-mas-vendidos';

describe('PlatosMasVendidosComponent', () => {
  let fixture: ComponentFixture<PlatosMasVendidosComponent>;
  let stateMock: any;

  beforeEach(async () => {
    stateMock = {
      platosMasVendidos: signal([
        { nombre: 'Pizza', valor: 20, detalle: '$ 20.000' },
        { nombre: 'Pasta', valor: 5, detalle: '$ 5.000' }
      ]),
      platosMasVendidosPreview: signal([
        { nombre: 'Pizza', valor: 20, detalle: '$ 20.000' },
        { nombre: 'Pasta', valor: 5, detalle: '$ 5.000' }
      ]),
      recomendacionTopVentas: signal('Destacar Pizza en maridajes sugeridos.'),
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PlatosMasVendidosComponent]
    })
      .overrideComponent(PlatosMasVendidosComponent, {
        set: { providers: [{ provide: DashboardStateService, useValue: stateMock }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PlatosMasVendidosComponent);
  });

  it('debería renderizar ranking y recomendación enriquecida', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('.ranking-row'))).toHaveLength(2);
    expect(fixture.debugElement.query(By.css('.ranking-title')).nativeElement.textContent).toContain('Pizza');
    expect(fixture.debugElement.query(By.css('.tooltip-trigger')).nativeElement.textContent).toContain('maridajes');
  });

  it('debería calcular porcentaje mínimo y máximo del ranking', () => {
    const component = fixture.componentInstance;

    expect(component.porcentajeRanking(20)).toBe(100);
    expect(component.porcentajeRanking(1)).toBe(8);
  });

  it('debería devolver cero si no hay máximo de ventas', () => {
    stateMock.platosMasVendidos.set([{ nombre: 'Sopa', valor: 0, detalle: '$ 0' }]);

    expect(fixture.componentInstance.porcentajeRanking(0)).toBe(0);
  });
});
