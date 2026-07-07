import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStateService } from '../../services/dashboard.state';
import { MozosComponent } from './mozos';

describe('MozosComponent', () => {
  let fixture: ComponentFixture<MozosComponent>;
  let stateMock: any;

  beforeEach(async () => {
    stateMock = {
      analisisMozos: signal('Equipo equilibrado.'),
      mozos: signal([
        { nombre: 'Ana', estado: 'Optimo', mesasAtendidas: 8, facturacionTotal: 12000, tiempoPromedioAtencion: '12m' },
        { nombre: 'Luis', estado: 'Sobrecargado', mesasAtendidas: 15, facturacionTotal: 30000, tiempoPromedioAtencion: '18m' },
        { nombre: 'Sol', estado: 'Libre', mesasAtendidas: 3, facturacionTotal: 5000, tiempoPromedioAtencion: '10m' }
      ]),
      esFavorito: vi.fn().mockReturnValue(true),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MozosComponent]
    })
      .overrideComponent(MozosComponent, {
        set: { providers: [{ provide: DashboardStateService, useValue: stateMock }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(MozosComponent);
  });

  it('debería renderizar mozos y badges según estado', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Equipo equilibrado');
    expect(fixture.debugElement.queryAll(By.css('.mozo-row'))).toHaveLength(3);
    const badges = fixture.debugElement.queryAll(By.css('.mozo-badge'));
    expect(badges[0].nativeElement.classList).toContain('success');
    expect(badges[1].nativeElement.classList).toContain('danger');
    expect(badges[2].nativeElement.classList).toContain('warning');
  });

  it('debería mostrar favorito activo y alternarlo', () => {
    fixture.detectChanges();

    const favorite = fixture.debugElement.query(By.css('.favorite-btn'));
    expect(favorite.nativeElement.classList).toContain('active');
    favorite.triggerEventHandler('click');
    expect(stateMock.toggleFavorito).toHaveBeenCalledWith('mozos');
  });
});
