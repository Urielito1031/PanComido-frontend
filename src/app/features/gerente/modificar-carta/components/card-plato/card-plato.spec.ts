import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Plato } from '../../../../../core/models/domain/plato';
import { CardPlatoComponent } from './card-plato';

describe('CardPlatoComponent', () => {
  let fixture: ComponentFixture<CardPlatoComponent>;
  let plato: Plato;

  beforeEach(async () => {
    plato = {
      id: 1,
      nombre: 'Milanesa',
      precioVenta: 1500,
      costo: 1000,
      visible: true,
      recomendado: true,
      imagen: 'milanesa.jpg',
      categoria: 'Principales',
      tipo: 'Comida',
      categoriaPlatoId: 2
    } as Plato;

    await TestBed.configureTestingModule({
      imports: [CardPlatoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CardPlatoComponent);
    fixture.componentRef.setInput('plato', plato);
    fixture.componentRef.setInput('porcentajesPlatos', [{ id: 2, nombre: 'Principales', porcentaje: 50 }]);
  });

  it('debería renderizar plato recomendado y calcular porcentaje/precio sugerido', () => {
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.dish-card-wrapper')).nativeElement;
    expect(wrapper.classList).toContain('recommended-card');
    expect(fixture.nativeElement.textContent).toContain('Milanesa');
    expect(fixture.componentInstance.obtenerPorcentajeGanancia()).toBe(50);
    expect(fixture.componentInstance.obtenerPrecioSugerido()).toBe(1500);
  });

  it('debería aplicar clases de layout, disabled y exploding', () => {
    fixture.componentRef.setInput('layoutMode', 'list');
    fixture.componentRef.setInput('isExploding', true);
    fixture.componentRef.setInput('plato', { ...plato, visible: false, recomendado: false });
    fixture.detectChanges();

    const wrapper = fixture.debugElement.query(By.css('.dish-card-wrapper')).nativeElement;
    expect(wrapper.classList).toContain('list-layout');
    expect(wrapper.classList).toContain('disabled-card');
    expect(wrapper.classList).toContain('exploding-card');
  });

  it('debería emitir acciones principales', () => {
    const component = fixture.componentInstance;
    const toggleSpy = vi.spyOn(component.toggleVisible, 'emit');
    const editSpy = vi.spyOn(component.editPlato, 'emit');
    const deleteSpy = vi.spyOn(component.deletePlato, 'emit');
    const recomendadoSpy = vi.spyOn(component.toggleRecomendado, 'emit');

    component.onToggle();
    component.onEdit();
    component.onDelete();
    component.onToggleRecomendado();

    expect(toggleSpy).toHaveBeenCalledWith(plato);
    expect(editSpy).toHaveBeenCalledWith(plato);
    expect(deleteSpy).toHaveBeenCalledWith(plato);
    expect(recomendadoSpy).toHaveBeenCalledWith(plato);
  });

  it('debería manejar error de imagen y menú contextual', () => {
    const event = { stopPropagation: vi.fn() } as unknown as Event;

    fixture.componentInstance.onImgError();
    fixture.componentInstance.toggleMenu(event);

    expect(fixture.componentInstance.imgError()).toBe(true);
    expect(fixture.componentInstance.isMenuOpen()).toBe(true);
    expect(event.stopPropagation).toHaveBeenCalled();

    fixture.componentInstance.closeMenu();
    expect(fixture.componentInstance.isMenuOpen()).toBe(false);
  });
});
