import { TestBed } from '@angular/core/testing';
import { InsumoList } from './insumo-list';
import { Insumo } from '../../../../../core/models/domain/insumo';
import { vi } from 'vitest';

describe('InsumoList', () => {
  const mockInsumos: Insumo[] = [
    {
      id: 1,
      nombre: 'Tomate',
      stockActual: 5,
      stockMinimo: 10,
      precioVentaFinal: 500,
      vencimiento: '2026-12-31',
      categoriaIngrediente: { id: 1, descripcion: 'Verduras' },
      unidadMedida: { id: 1, nombre: 'kg' },
    },
    {
      id: 2,
      nombre: 'Harina',
      stockActual: 30,
      stockMinimo: 10,
      precioVentaFinal: 300,
      vencimiento: '',
      categoriaIngrediente: null,
      unidadMedida: null,
    },
    {
      id: 3,
      nombre: 'Sal',
      stockActual: 15,
      stockMinimo: 10,
      precioVentaFinal: 100,
      vencimiento: 'invalida',
      categoriaIngrediente: { id: 2, descripcion: 'Condimentos' },
      unidadMedida: { id: 2, nombre: 'g' },
    },
  ];

  async function setup(productos: Insumo[]) {
    await TestBed.configureTestingModule({
      imports: [InsumoList],
    }).compileComponents();

    const fixture = TestBed.createComponent(InsumoList);
    fixture.componentRef.setInput('productos', productos);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('debería crearse correctamente', async () => {
    const { component } = await setup(mockInsumos);
    expect(component).toBeTruthy();
  });

  describe('filas computed', () => {
    it('debería mapear productos a StockRow correctamente', async () => {
      const { component } = await setup(mockInsumos);
      const filas = component.filas();

      expect(filas.length).toBe(3);

      const tomate = filas[0];
      expect(tomate.nombre).toBe('Tomate');
      expect(tomate.categoria).toBe('Verduras');
      expect(tomate.stock).toBe('5 kg');
      expect(tomate.minimo).toBe('10 kg');
      expect(tomate.precioVentaFinal).toBe(500);
      expect(tomate.vencimiento).toBe('31/12/2026');
    });

    it('debería calcular estado crítico cuando stock es menor al mínimo', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.filas()[0].estado).toBe('critical');
      expect(component.filas()[0].estadoLabel).toBe('Crítico');
    });

    it('debería calcular estado de advertencia cuando stock es menor al mínimo * 2', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.filas()[2].estado).toBe('warning');
      expect(component.filas()[2].estadoLabel).toBe('Bajo');
    });

    it('debería calcular estado exitoso cuando stock es mayor o igual al mínimo * 2', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.filas()[1].estado).toBe('success');
      expect(component.filas()[1].estadoLabel).toBe('Ok');
    });

    it('debería manejar categoría de ingrediente faltante', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.filas()[1].categoria).toBe('Sin categoría');
    });

    it('debería manejar unidad de medida faltante', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.filas()[1].stock).toBe('30');
    });

    it('debería devolver vencimiento sin cambios si la fecha es inválida', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.filas()[2].vencimiento).toBe('invalida');
    });
  });

  describe('empty state', () => {
    it('debería renderizar estado vacío cuando productos está vacío', async () => {
      const { fixture } = await setup([]);
      const emptyEl = fixture.nativeElement.querySelector('.insumo-empty-state');
      expect(emptyEl).toBeTruthy();
      expect(emptyEl.textContent).toContain('No hay productos para mostrar');
    });
  });

  describe('trackById', () => {
    it('debería hacer track por id', async () => {
      const { component } = await setup(mockInsumos);
      expect(component.trackById(0, component.filas()[0])).toBe(1);
    });
  });

  describe('editar output', () => {
    it('debería emitir id cuando se dispara editar', async () => {
      const { component } = await setup(mockInsumos);
      const spy = vi.fn();
      component.editar.subscribe(spy);
      component.editar.emit(1);
      expect(spy).toHaveBeenCalledWith(1);
    });
  });

  describe('reactive updates', () => {
    it('debería recalcular filas cuando cambia el input productos', async () => {
      const { fixture, component } = await setup(mockInsumos);
      expect(component.filas().length).toBe(3);

      fixture.componentRef.setInput('productos', [mockInsumos[0]]);
      fixture.detectChanges();

      expect(component.filas().length).toBe(1);
    });
  });
});
