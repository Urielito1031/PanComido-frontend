import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListaPlatosComensalComponent } from './lista-platos-comensal';
import { CartaItem } from '../../../../../core/models/domain/carta-item';

describe('ListaPlatosComensalComponent', () => {
  let component: ListaPlatosComensalComponent;
  let fixture: ComponentFixture<ListaPlatosComensalComponent>;

  const mockPlatos: CartaItem[] = [
    {
      id: 1,
      nombre: 'Pizza',
      descripcion: 'Pizza clásica',
      precio: 4500,
      urlImagen: 'pizza.jpg',
      esPlato: true,
      esDestacado: true,
      tiempoPreparacionBase: 20,
      tiempoPreparacionEstimado: 30,
      tipoPlato: 'Pizza',
      categoriaBebida: null,
      restricciones: ['Vegetariano'],
    },
    {
      id: 2,
      nombre: 'Hamburguesa',
      descripcion: 'Hamburguesa completa',
      precio: 7000,
      urlImagen: 'burger.jpg',
      esPlato: true,
      esDestacado: false,
      tiempoPreparacionBase: 15,
      tiempoPreparacionEstimado: 20,
      tipoPlato: 'Principal',
      categoriaBebida: null,
      restricciones: [],
    },
  ];

  const mockBebidas: CartaItem[] = [
    {
      id: 3,
      nombre: 'Coca Cola',
      descripcion: 'Gaseosa 500ml',
      precio: 1500,
      urlImagen: 'coca.jpg',
      esPlato: false,
      esDestacado: false,
      tiempoPreparacionBase: null,
      tiempoPreparacionEstimado: null,
      tipoPlato: null,
      categoriaBebida: 'Sin alcohol',
      restricciones: [],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaPlatosComensalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ListaPlatosComensalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.componentRef.setInput('items', mockPlatos);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('debería separar platos y bebidas correctamente', () => {
    fixture.componentRef.setInput('items', [...mockPlatos, ...mockBebidas]);
    fixture.detectChanges();
    expect(component.platos().length).toBe(2);
    expect(component.bebidas().length).toBe(1);
  });

  it('debería mostrar solo platos si no hay bebidas', () => {
    fixture.componentRef.setInput('items', mockPlatos);
    fixture.detectChanges();
    expect(component.platos().length).toBe(2);
    expect(component.bebidas().length).toBe(0);
  });

  it('debería mostrar solo bebidas si no hay platos', () => {
    fixture.componentRef.setInput('items', mockBebidas);
    fixture.detectChanges();
    expect(component.platos().length).toBe(0);
    expect(component.bebidas().length).toBe(1);
  });

  it('debería emitir agregarPedido', () => {
    fixture.componentRef.setInput('items', mockPlatos);
    fixture.detectChanges();
    const spy = vi.spyOn(component.agregarPedido, 'emit');
    const item = { plato: mockPlatos[0], cantidad: 1 };
    component.onAgregarPedido(item);
    expect(spy).toHaveBeenCalledWith(item);
  });

  it('debería detectar lista vacía', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    expect(component.platos().length).toBe(0);
    expect(component.bebidas().length).toBe(0);
  });
});
