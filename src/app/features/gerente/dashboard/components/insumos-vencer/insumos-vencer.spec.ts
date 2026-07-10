import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStateService } from '../../services/dashboard.state';
import { InsumosVencerComponent } from './insumos-vencer';

describe('InsumosVencerComponent', () => {
  let fixture: ComponentFixture<InsumosVencerComponent>;
  let stateMock: any;

  const insumos = [
    { nombre: 'Tomate', relativo: 'vence hoy', cantidad: '4 kg', fecha: '06/07/2026', criticidad: 'alta' },
    { nombre: 'Queso', relativo: 'vence mañana', cantidad: '2 kg', fecha: '07/07/2026', criticidad: 'media' },
    { nombre: 'Harina', relativo: 'vence en 5 días', cantidad: '10 kg', fecha: '11/07/2026', criticidad: 'baja' }
  ];

  beforeEach(async () => {
    stateMock = {
      insumosPorVencer: signal(insumos),
      vencimientosResumen: signal([
        { label: 'Total', value: 3, tone: 'info', key: 'todos' },
        { label: 'Alta', value: 1, tone: 'danger', key: 'alta' },
        { label: 'Media', value: 1, tone: 'warning', key: 'media' },
        { label: 'Baja', value: 1, tone: 'neutral', key: 'baja' }
      ]),
      recomendacionOperativa: signal('Priorizar Tomate.'),
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [InsumosVencerComponent]
    })
      .overrideComponent(InsumosVencerComponent, {
        set: { providers: [{ provide: DashboardStateService, useValue: stateMock }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(InsumosVencerComponent);
  });

  it('debería renderizar resumen, recomendación e insumos con clases de criticidad', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.panel-badge')).nativeElement.textContent).toContain('3 items');
    expect(fixture.debugElement.query(By.css('.expiry-recommendation')).nativeElement.textContent).toContain('Priorizar Tomate');
    expect(fixture.debugElement.queryAll(By.css('.expiry-row'))).toHaveLength(3);
    expect(fixture.debugElement.query(By.css('.expiry-row.alta'))).toBeTruthy();
  });

  it('debería filtrar por criticidad y reiniciar la página', () => {
    const component = fixture.componentInstance;
    component.irAPagina(2);

    component.establecerFiltroCriticidad('media');
    fixture.detectChanges();

    expect(component.paginaActual()).toBe(1);
    expect(component.insumosFiltrados()).toHaveLength(1);
    expect(fixture.debugElement.query(By.css('.expiry-row')).nativeElement.textContent).toContain('Queso');
  });

  it('debería limitar la paginación dentro del rango permitido', () => {
    stateMock.insumosPorVencer.set(Array.from({ length: 8 }, (_, index) => ({
      nombre: `Insumo ${index + 1}`,
      relativo: 'vence pronto',
      cantidad: '1 u.',
      fecha: '06/07/2026',
      criticidad: 'alta'
    })));
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.irAPagina(99);
    expect(component.paginaActual()).toBe(2);

    component.irAPagina(0);
    expect(component.paginaActual()).toBe(1);
  });
});
