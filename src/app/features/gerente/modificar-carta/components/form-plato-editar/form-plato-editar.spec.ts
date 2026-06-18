import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormPlatoEditar } from './form-plato-editar';
import { ComponentRef } from '@angular/core';
import { Plato } from '../../../../../core/models/domain/plato';
import { vi } from 'vitest';

describe('FormPlatoEditar', () => {
  let component: FormPlatoEditar;
  let fixture: ComponentFixture<FormPlatoEditar>;
  let componentRef: ComponentRef<FormPlatoEditar>;

  const mockPlato: Plato = {
    id: 1,
    nombre: 'Pizza',
    precioVenta: 120,
    costo: 60,
    tiempoPreparacion: 20,
    categoria: 'Principales',
    visible: true,
    receta: [],
    imagen: ''
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormPlatoEditar]
    }).compileComponents();

    fixture = TestBed.createComponent(FormPlatoEditar);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    
    // Configurar inputs por defecto (Angular 17+ Signals pattern)
    componentRef.setInput('plato', null);
    componentRef.setInput('categorias', ['Principales', 'Entradas', 'Bebidas', 'Postres']);

    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario vacío con defaults si plato es null', () => {
    expect(component.form.value.nombre).toBe('');
    expect(component.form.value.precioVenta).toBe(0);
    expect(component.form.value.categoria).toBe('Principales');
    expect(component.form.valid).toBe(false); // nombre es requerido
  });

  it('debería actualizar el formulario cuando cambia el input plato (trigger de effect)', () => {
    componentRef.setInput('plato', mockPlato);
    fixture.detectChanges(); // Ejecuta effects

    expect(component.form.value.nombre).toBe('Pizza');
    expect(component.form.value.precioVenta).toBe(120);
    expect(component.form.value.costo).toBe(60);
    expect(component.form.value.tiempoPreparacion).toBe(20);
    expect(component.form.value.categoria).toBe('Principales');
    expect(component.form.valid).toBe(true);
  });

  it('debería emitir el evento guardar con los valores del form si es válido', () => {
    const emitSpy = vi.spyOn(component.guardar, 'emit');
    
    componentRef.setInput('plato', mockPlato);
    fixture.detectChanges();
    
    component.onSubmit();
    
    expect(emitSpy).toHaveBeenCalledWith(component.form.value);
  });

  it('no debería emitir guardar si el form es inválido y debe marcar como touched', () => {
    const emitSpy = vi.spyOn(component.guardar, 'emit');
    
    // Por defecto es null, form inválido
    component.onSubmit();
    
    expect(emitSpy).not.toHaveBeenCalled();
    expect(component.form.controls['nombre'].touched).toBe(true);
    expect(component.form.controls['precioVenta'].touched).toBe(true);
  });
});
