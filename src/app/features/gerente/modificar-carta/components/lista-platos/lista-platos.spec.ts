import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Plato } from '../../../../../core/models/domain/plato';
import { CardPlatoComponent } from '../card-plato/card-plato';
import { ListaPlatosComponent } from './lista-platos';

describe('ListaPlatosComponent', () => {
  let fixture: ComponentFixture<ListaPlatosComponent>;
  const platos = [
    { id: 1, nombre: 'Pizza', precioVenta: 2000, costo: 1000, visible: true, recomendado: false },
    { id: 2, nombre: 'Pasta', precioVenta: 1800, costo: 900, visible: false, recomendado: true }
  ] as Plato[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPlatosComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaPlatosComponent);
    fixture.componentRef.setInput('platos', platos);
    fixture.componentRef.setInput('explodingId', 2);
  });

  it('debería renderizar cards y marcar la que explota', () => {
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.directive(CardPlatoComponent));
    expect(cards).toHaveLength(2);
    expect(cards[1].componentInstance.isExploding()).toBe(true);
  });

  it('debería emitir eventos reenviados desde handlers', () => {
    const component = fixture.componentInstance;
    const toggleSpy = vi.spyOn(component.toggleVisible, 'emit');
    const editSpy = vi.spyOn(component.editPlato, 'emit');
    const deleteSpy = vi.spyOn(component.deletePlato, 'emit');
    const recomendadoSpy = vi.spyOn(component.toggleRecomendado, 'emit');

    component.onToggleVisible(platos[0]);
    component.onEditPlato(platos[0]);
    component.onDeletePlato(platos[0]);
    component.onToggleRecomendado(platos[0]);

    expect(toggleSpy).toHaveBeenCalledWith(platos[0]);
    expect(editSpy).toHaveBeenCalledWith(platos[0]);
    expect(deleteSpy).toHaveBeenCalledWith(platos[0]);
    expect(recomendadoSpy).toHaveBeenCalledWith(platos[0]);
  });

  it('debería mostrar estado vacío', () => {
    fixture.componentRef.setInput('platos', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay platos disponibles');
  });
});
