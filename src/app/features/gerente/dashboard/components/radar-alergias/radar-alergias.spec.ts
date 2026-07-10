import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStateService } from '../../services/dashboard.state';
import { RadarAlergiasComponent } from './radar-alergias';

describe('RadarAlergiasComponent', () => {
  let fixture: ComponentFixture<RadarAlergiasComponent>;
  let stateMock: any;

  beforeEach(async () => {
    stateMock = {
      ingredientesExcluidos: signal([]),
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [RadarAlergiasComponent]
    })
      .overrideComponent(RadarAlergiasComponent, {
        set: { providers: [{ provide: DashboardStateService, useValue: stateMock }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(RadarAlergiasComponent);
  });

  it('debería mostrar estado vacío cuando no hay exclusiones', () => {
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.empty-radar-state')).nativeElement.textContent).toContain('No se registran exclusiones');
  });

  it('debería renderizar exclusiones con barra y tono crítico', () => {
    stateMock.ingredientesExcluidos.set([
      {
        ingredienteId: 1,
        nombreIngrediente: 'Maní',
        cantidadExclusiones: 8,
        platoMasExcluido: 'Ensalada thai',
        tasaExclusionPlatoMasExcluido: '45%'
      }
    ]);

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.ingredient-name')).nativeElement.textContent).toContain('Maní');
    expect(fixture.debugElement.query(By.css('.tasa-badge')).nativeElement.textContent).toContain('45%');
    expect(fixture.debugElement.query(By.css('.tasa-badge')).nativeElement.classList).toContain('tasa-badge-critical');
  });

  it('debería alternar favorito desde el botón', () => {
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.favorite-btn')).triggerEventHandler('click');

    expect(stateMock.toggleFavorito).toHaveBeenCalledWith('radar-alergias');
  });

  it('debería clasificar los tonos por tasa', () => {
    const component = fixture.componentInstance;

    expect(component.obtenerTonoTasa('45%')).toBe('tasa-badge-critical');
    expect(component.obtenerTonoTasa('20%')).toBe('tasa-badge-medium');
    expect(component.obtenerTonoTasa('7%')).toBe('tasa-badge-low');
  });
});
