import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStateService } from '../../services/dashboard.state';
import { PlatosMenosVendidosComponent } from './platos-menos-vendidos';

describe('PlatosMenosVendidosComponent', () => {
  let fixture: ComponentFixture<PlatosMenosVendidosComponent>;
  let stateMock: any;

  beforeEach(async () => {
    stateMock = {
      platosMenosVendidosPreview: signal([
        { nombre: 'Sopa', valor: 1, detalle: '$ 1.000' },
        { nombre: 'Tarta', valor: 0, detalle: '$ 0' },
        { nombre: 'Flan', valor: 0, detalle: '$ 0' }
      ]),
      esModoCalendario: signal(false),
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn(),
      abrirDetallePlato: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [PlatosMenosVendidosComponent]
    })
      .overrideComponent(PlatosMenosVendidosComponent, {
        set: { providers: [{ provide: DashboardStateService, useValue: stateMock }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(PlatosMenosVendidosComponent);
  });

  it('debería renderizar acciones sugeridas por posición', () => {
    fixture.detectChanges();

    const rows = fixture.debugElement.queryAll(By.css('.compact-row'));
    expect(rows).toHaveLength(3);
    expect(rows[0].nativeElement.textContent).toContain('Revisar precio o visibilidad');
    expect(rows[2].nativeElement.textContent).toContain('Candidato a pausar o relanzar');
  });

  it('debería mostrar y cerrar criterios de sugerencia', () => {
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.info-icon-btn')).triggerEventHandler('click', { stopPropagation: vi.fn() });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.criterios-popover'))).toBeTruthy();

    fixture.debugElement.query(By.css('.close-popover-btn')).triggerEventHandler('click');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.criterios-popover'))).toBeFalsy();
  });

  it('debería aplicar clase de filas grandes en modo calendario', () => {
    stateMock.esModoCalendario.set(true);
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.compact-list')).nativeElement.classList).toContain('large-rows');
  });

  it('debería pedir análisis del plato seleccionado', () => {
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.low-action-btn')).triggerEventHandler('click');

    expect(stateMock.abrirDetallePlato).toHaveBeenCalledWith(
      { nombre: 'Sopa', valor: 1, detalle: '$ 1.000' },
      0
    );
  });
});
