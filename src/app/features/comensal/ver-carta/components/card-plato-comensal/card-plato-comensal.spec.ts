import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';

import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { CardPlatoComensalComponent } from './card-plato-comensal';
import { CartaItem } from '../../../../../core/models/domain/carta-item';

function crearPlatoMock(overrides: Partial<CartaItem> = {}): CartaItem {
  return {
    id: 1,
    nombre: 'Pizza Muzzarella',
    descripcion: 'Pizza clásica con mozzarella y salsa de tomate',
    precio: 4500,
    urlImagen: 'pizza.jpg',
    esPlato: true,
    esDestacado: true,
    tiempoPreparacionBase: 20,
    tiempoPreparacionEstimado: 30,
    tipoPlato: 'Pizza',
    categoriaBebida: null,
    restricciones: ['Vegetariano'],
    ...overrides,
  };
}

describe('CardPlatoComensalComponent', () => {

  let component: CardPlatoComensalComponent;
  let fixture: ComponentFixture<CardPlatoComensalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardPlatoComensalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardPlatoComensalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('plato', crearPlatoMock());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería renderizar el nombre del plato', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pizza Muzzarella');
  });

  it('debería renderizar la descripción', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Pizza clásica con mozzarella y salsa de tomate');
  });

  it('debería mostrar el badge Destacado si esDestacado es true', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.dish-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Destacado');
  });

  it('debería mostrar el tipo de plato', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const typeBadge = compiled.querySelector('.dish-type-badge');
    expect(typeBadge).toBeTruthy();
    expect(typeBadge?.textContent).toContain('Pizza');
  });

  it('debería mostrar las restricciones alimentarias', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const tags = compiled.querySelectorAll('.restriccion-tag');
    expect(tags.length).toBe(1);
    expect(tags[0].textContent).toContain('Vegetariano');
  });

  it('debería mostrar el tiempo estimado de preparación', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('30 min');
  });

  it('debería mostrar el precio formateado', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('$ 4500');
  });

  it('debería emitir el plato al agregar', () => {
    const spy = vi.spyOn(component.agregarPedido, 'emit');
    component.agregar();
    expect(spy).toHaveBeenCalledWith({ plato: component.plato(), cantidad: 1 });
  });

  it('debería ocultar badge Destacado si esDestacado es false', () => {
    fixture.componentRef.setInput('plato', crearPlatoMock({ esDestacado: false }));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const badge = compiled.querySelector('.dish-badge');
    expect(badge).toBeFalsy();
  });

  it('debería ocultar restricciones si el array está vacío', () => {
    fixture.componentRef.setInput('plato', crearPlatoMock({ restricciones: [] }));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const tags = compiled.querySelectorAll('.restriccion-tag');
    expect(tags.length).toBe(0);
  });

  it('debería mostrar categoría de bebida si no es plato', () => {
    fixture.componentRef.setInput('plato', crearPlatoMock({
      esPlato: false,
      categoriaBebida: 'Sin alcohol',
      tipoPlato: null,
      esDestacado: false,
      tiempoPreparacionBase: null,
      tiempoPreparacionEstimado: null,
      restricciones: [],
    }));
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const typeBadge = compiled.querySelector('.dish-type-badge');
    expect(typeBadge).toBeTruthy();
    expect(typeBadge?.textContent).toContain('Sin alcohol');
    const badge = compiled.querySelector('.dish-badge');
    expect(badge).toBeFalsy();
  });

  it('debería incrementar la cantidad', () => {
    component.cantidad.set(1);
    component.incrementar();
    expect(component.cantidad()).toBe(2);
  });

  it('debería decrementar la cantidad sin bajar de 1', () => {
    component.cantidad.set(1);
    component.decrementar();
    expect(component.cantidad()).toBe(1);
    component.cantidad.set(3);
    component.decrementar();
    expect(component.cantidad()).toBe(2);
  });
});
