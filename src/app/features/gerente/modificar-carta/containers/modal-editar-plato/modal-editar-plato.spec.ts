import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Plato } from '../../../../../core/models/domain/plato';
import { PlatoApiService } from '../../../services/plato.api';
import { ModalEditarPlatoComponent } from './modal-editar-plato';

describe('ModalEditarPlatoComponent', () => {
  let fixture: ComponentFixture<ModalEditarPlatoComponent>;
  let plato: Plato;

  beforeEach(async () => {
    plato = {
      id: 1,
      nombre: 'Pizza',
      precioVenta: 1500,
      costo: 1000,
      imagen: 'pizza.jpg',
      visible: true,
      descripcion: 'Clásica',
      tiempoPreparacion: 20,
      tipoPlatoId: 1,
      categoriaPlatoId: 2,
      restriccionesIds: [2],
      esPrecioManual: false,
      receta: [
        { id: 10, nombre: 'Harina', cantidad: 1, unidadMedida: 'kg', costoUnitario: 1000, opcional: false }
      ]
    } as Plato;

    await TestBed.configureTestingModule({
      imports: [ModalEditarPlatoComponent],
      providers: [
        {
          provide: PlatoApiService,
          useValue: {
            getDatosFormulario: vi.fn().mockReturnValue(of({
              tiposPlato: [{ id: 1, nombre: 'Principal' }],
              categoriasPlato: [{ id: 2, nombre: 'Pizzas' }],
              restricciones: [{ id: 2, nombre: 'Vegetariano' }],
              porcentajes: { platos: [{ id: 2, nombre: 'Pizzas', porcentaje: 50 }] },
              ingredientes: [{ id: 11, nombre: 'Queso', unidadMedida: 'gr', costoUnitario: 2 }]
            }))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEditarPlatoComponent);
    fixture.componentRef.setInput('plato', plato);
    fixture.detectChanges();
  });

  it('debería inicializar signals desde el plato y datos de formulario', () => {
    const component = fixture.componentInstance;

    expect(component.nombre()).toBe('Pizza');
    expect(component.vegetariano()).toBe(true);
    expect(component.receta()[0].unidadMedida).toBe('KG');
    expect(component.tiposPlato()).toHaveLength(1);
    expect(component.porcentajeVigente()).toBe(50);
    expect(component.precioConGanancia()).toBe(1500);
  });

  it('debería gestionar ingredientes, búsqueda y opcionales', () => {
    const component = fixture.componentInstance;

    component.onSearchChanged('ques');
    expect(component.sugerencias()).toHaveLength(1);

    component.agregarIngrediente({ id: 11, nombre: 'Queso', unidadMedida: 'gr', costoUnitario: 2 });
    expect(component.receta()).toHaveLength(2);
    expect(component.busqueda()).toBe('');

    component.toggleOpcional(11);
    expect(component.ingredientesOpcionales()[0].id).toBe(11);

    component.eliminarIngrediente(11);
    expect(component.receta()).toHaveLength(1);
  });

  it('debería validar precio manual, recalcular y emitir save válido', () => {
    const component = fixture.componentInstance;
    const saveSpy = vi.spyOn(component.save, 'emit');

    component.onPrecioVentaChange(100);
    expect(component.precioVentaTocado()).toBe(true);
    expect(component.precioEsMenorQueCosto()).toBe(true);

    component.onRecalcularPrecio();
    expect(component.precioVenta()).toBe(1500);
    expect(component.precioVentaTocado()).toBe(false);

    component.onToggleVisible();
    component.onSave();

    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({
      nombre: 'Pizza',
      precioVenta: 1500,
      costo: 1000,
      visible: false,
      tipoPlatoId: 1,
      categoriaPlatoId: 2,
      restriccionesIds: [2]
    }));
  });

  it('no debería emitir save si faltan campos requeridos y debería emitir close', () => {
    const component = fixture.componentInstance;
    const saveSpy = vi.spyOn(component.save, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');

    component.nombre.set('');
    component.onSave();
    component.onClose();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
