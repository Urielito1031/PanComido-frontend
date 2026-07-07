import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardStateService } from '../../services/dashboard.state';
import { KpiCardComponent } from './kpi-card';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;
  let stateMock: any;

  beforeEach(async () => {
    stateMock = {
      resumenOperativo: signal({
        totalVentas: '$ 10.000',
        totalPedidos: 12,
        ticketPromedio: '$ 833',
        promedioDiarioPedidos: 3,
        variacionVentas: '-5%',
        variacionPedidos: '+2%',
        variacionTicket: '+1%'
      }),
      variacionVentasEsNegativa: signal(true),
      variacionPedidosEsNegativa: signal(false),
      variacionTicketEsNegativa: signal(false),
      promedioDiarioVentas: signal(2500),
      esFavorito: vi.fn().mockReturnValue(false),
      toggleFavorito: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [KpiCardComponent]
    })
      .overrideComponent(KpiCardComponent, {
        set: { providers: [{ provide: DashboardStateService, useValue: stateMock }] }
      })
      .compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
  });

  it('debería renderizar ventas con variación negativa y favorito', () => {
    fixture.componentRef.setInput('type', 'ventas');
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.kpi-card')).nativeElement.classList).toContain('revenue');
    expect(fixture.debugElement.query(By.css('.kpi-change')).nativeElement.classList).toContain('negative');
    expect(fixture.nativeElement.textContent).toContain('$ 10.000');

    fixture.debugElement.query(By.css('.fav-icon-btn')).triggerEventHandler('click', { stopPropagation: vi.fn() });
    expect(stateMock.toggleFavorito).toHaveBeenCalledWith('kpi-ventas');
  });

  it('debería renderizar pedidos con ritmo estable', () => {
    fixture.componentRef.setInput('type', 'pedidos');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pedidos totales');
    expect(fixture.nativeElement.textContent).toContain('Estable');
  });

  it('debería renderizar ticket promedio', () => {
    fixture.componentRef.setInput('type', 'ticket');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ticket promedio');
    expect(fixture.nativeElement.textContent).toContain('$ 833');
  });

  it('debería renderizar promedio diario aunque no haya resumen', () => {
    stateMock.resumenOperativo.set(null);
    fixture.componentRef.setInput('type', 'promedio');
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent.replace(/\u00a0/g, ' ');
    expect(text).toContain('Promedio diario');
    expect(text).toContain('$ 2.500');
  });
});
