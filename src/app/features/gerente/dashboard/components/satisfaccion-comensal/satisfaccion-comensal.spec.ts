import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { SatisfaccionComensalComponent } from './satisfaccion-comensal';
import { DashboardStateService } from '../../services/dashboard.state';
import { DashboardSatisfaccionMetricas } from '../../../../../core/models/domain/dashboard';

describe('SatisfaccionComensalComponent', () => {
  let fixture: ComponentFixture<SatisfaccionComensalComponent>;
  let component: SatisfaccionComensalComponent;
  let satisfaccionSignal: ReturnType<typeof signal<DashboardSatisfaccionMetricas | null>>;
  let mockState: any;

  const metricas: DashboardSatisfaccionMetricas = {
    promedioComida: 3.71,
    promedioLugar: 3.84,
    promedioAtencion: 3.23,
    totalEncuestas: 31,
    totalDerivadosGoogleMaps: 13,
    porcentajeDerivados: 41.9
  };

  beforeEach(async () => {
    satisfaccionSignal = signal<DashboardSatisfaccionMetricas | null>(metricas);
    mockState = {
      satisfaccionComensal: satisfaccionSignal,
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SatisfaccionComensalComponent],
      providers: [
        { provide: DashboardStateService, useValue: mockState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SatisfaccionComensalComponent);
    component = fixture.componentInstance;
  });

  it('deberia renderizar promedios y tasa de derivacion', () => {
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Satisfacción del comensal');
    expect(text).toContain('3.7/5');
    expect(text).toContain('3.8/5');
    expect(text).toContain('3.2/5');
    expect(text).toContain('41.9%');
    expect(text).toContain('De 31 recibidas, 13 fueron invitados a Google Maps.');
  });

  it('deberia usar escala radial fija maxima de 5', () => {
    expect(component.escalaMaxima).toBe(5);
    expect(component.obtenerRadio(4)).toBeLessThan(component.radioMaximo);
    expect(component.obtenerRadio(5)).toBe(component.radioMaximo);
    expect(component.obtenerRadio(8)).toBe(component.radioMaximo);
  });

  it('deberia aplicar clase success cuando la derivacion es alta', () => {
    fixture.detectChanges();

    const card = fixture.debugElement.query(By.css('.google-rate-card.success'));
    expect(card).toBeTruthy();
  });

  it('deberia mostrar estado vacio sin encuestas', () => {
    satisfaccionSignal.set({
      ...metricas,
      totalEncuestas: 0,
      totalDerivadosGoogleMaps: 0,
      porcentajeDerivados: 0
    });
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.satisfaction-empty-state'))).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay encuestas');
    expect(fixture.debugElement.query(By.css('.satisfaction-radar-polygon'))).toBeFalsy();
  });

  it('deberia alternar favorito desde el boton', () => {
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('.favorite-btn'));
    button.triggerEventHandler('click', new MouseEvent('click'));

    expect(mockState.toggleFavorito).toHaveBeenCalledWith('satisfaccion-comensal');
  });
});
