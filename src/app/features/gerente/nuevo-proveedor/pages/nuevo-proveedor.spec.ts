import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { CategoriaInsumo } from '../../../../core/models/domain/categoria-insumo';
import { ProveedorApiService } from '../../services/proveedor.api';
import { NuevoProveedorComponent } from './nuevo-proveedor';

describe('NuevoProveedorComponent', () => {
  let component: NuevoProveedorComponent;
  let fixture: ComponentFixture<NuevoProveedorComponent>;
  let routerMock: { navigate: ReturnType<typeof vi.fn> };
  let proveedorApiMock: {
    getCategoriasInsumo: ReturnType<typeof vi.fn>;
    crearProveedor: ReturnType<typeof vi.fn>;
  };

  const categoriasMock: CategoriaInsumo[] = [
    { id: 1, descripcion: 'Verdura', tipoAplica: 'Ingrediente' },
    { id: 2, descripcion: 'Carnes', tipoAplica: 'Ingrediente' },
    { id: 3, descripcion: 'Gaseosas', tipoAplica: 'Bebida' }
  ];

  beforeEach(async () => {
    routerMock = { navigate: vi.fn() };
    proveedorApiMock = {
      getCategoriasInsumo: vi.fn().mockReturnValue(of(categoriasMock)),
      crearProveedor: vi.fn().mockReturnValue(of({ id: 10 }))
    };

    await TestBed.configureTestingModule({
      imports: [NuevoProveedorComponent],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ProveedorApiService, useValue: proveedorApiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NuevoProveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('debería cargar categorías disponibles al iniciar', () => {
    expect(proveedorApiMock.getCategoriasInsumo).toHaveBeenCalled();
    expect(component.categoriasDisponibles()).toEqual(categoriasMock);
  });

  it('debería agrupar categorías disponibles por tipo (ingrediente/bebida)', () => {
    expect(component.categoriasIngredienteFiltradas()).toEqual([categoriasMock[0], categoriasMock[1]]);
    expect(component.categoriasBebidaFiltradas()).toEqual([categoriasMock[2]]);
  });

  it('debería mostrar resumen en vivo del proveedor', () => {
    component.proveedorForm.setValue({ nombre: '  Distribuidora Norte  ', telefono: ' +54 11 5555-1234 ' });
    component.toggleCategoria(categoriasMock[0]);

    expect(component.nombrePreview()).toBe('Distribuidora Norte');
    expect(component.telefonoPreview()).toBe('+54 11 5555-1234');
    expect(component.categorias()).toEqual(['Verdura']);
  });

  it('no debería guardar si falta categoría', () => {
    component.proveedorForm.setValue({ nombre: 'Distribuidora Norte', telefono: '+54 11 5555-1234' });

    component.guardarProveedor();

    expect(component.categoriasInvalidas()).toBe(true);
    expect(proveedorApiMock.crearProveedor).not.toHaveBeenCalled();
  });

  it('debería crear proveedor con datos normalizados y navegar', () => {
    component.proveedorForm.setValue({ nombre: '  Distribuidora Norte  ', telefono: ' +54 11 5555-1234 ' });
    component.toggleCategoria(categoriasMock[0]);

    component.guardarProveedor();

    expect(proveedorApiMock.crearProveedor).toHaveBeenCalledWith({
      nombre: 'Distribuidora Norte',
      numeroTelefonoWsp: '+54 11 5555-1234',
      categoriaIds: [1]
    });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/staff', 'gerente', 'ver-proveedores'], {
      state: { created: true, message: 'Proveedor creado correctamente' }
    });
  });

  it('debería mostrar error si falla la creación', () => {
    proveedorApiMock.crearProveedor.mockReturnValue(throwError(() => new Error('fallo')));
    component.proveedorForm.setValue({ nombre: 'Distribuidora Norte', telefono: '+54 11 5555-1234' });
    component.toggleCategoria(categoriasMock[0]);

    component.guardarProveedor();

    expect(component.errorGuardado()).toBeTruthy();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('debería reintentar carga de categorías', () => {
    component.reintentarCategorias();

    expect(proveedorApiMock.getCategoriasInsumo).toHaveBeenCalledTimes(2);
  });
});
