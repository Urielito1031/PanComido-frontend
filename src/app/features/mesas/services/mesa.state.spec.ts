import { TestBed } from '@angular/core/testing';
import { MesaState } from './mesa.state';
import { MesaService } from './mesa.service';
import { MesaLecturaState } from '../shared/mesa-lectura-state';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { EstadoMesa, FormaMesa, Mesa } from '../../../core/models/domain/mesa';

import { vi } from 'vitest';

describe('MesaState', () => {
  let state: MesaState;
  let mesaServiceMock: any;
  let mesaLecturaStateMock: any;

  beforeEach(() => {
    mesaServiceMock = {
      guardarMapa: vi.fn()
    };
    
    mesaLecturaStateMock = {
      mesas: signal<Mesa[]>([]),
      mesaSeleccionada: signal<Mesa | null>(null),
      notificacion: signal<{mensaje: string, tipo: string} | null>(null),
      cargarMesas: vi.fn(),
      seleccionarMesa: vi.fn(),
      ocuparMesa: vi.fn(),
      cambiarEstadoMesa: vi.fn(),
      mostrarNotificacion: vi.fn(),
      setMesas: vi.fn((mesas) => mesaLecturaStateMock.mesas.set(mesas)),
      updateMesas: vi.fn((updateFn) => {
        const result = updateFn(mesaLecturaStateMock.mesas());
        mesaLecturaStateMock.mesas.set(result);
      })
    };

    TestBed.configureTestingModule({
      providers: [
        MesaState,
        { provide: MesaService, useValue: mesaServiceMock },
        { provide: MesaLecturaState, useValue: mesaLecturaStateMock }
      ]
    });

    state = TestBed.inject(MesaState);
  });

  it('debería crearse', () => {
    expect(state).toBeTruthy();
  });

  it('debería delegar llamadas a MesaLecturaState', () => {
    state.cargarMesas();
    expect(mesaLecturaStateMock.cargarMesas).toHaveBeenCalled();

    state.seleccionarMesa(1);
    expect(mesaLecturaStateMock.seleccionarMesa).toHaveBeenCalledWith(1);

    state.ocuparMesa(1, 2);
    expect(mesaLecturaStateMock.ocuparMesa).toHaveBeenCalledWith(1, 2);

    state.cambiarEstadoMesa(1, EstadoMesa.Ocupada);
    expect(mesaLecturaStateMock.cambiarEstadoMesa).toHaveBeenCalledWith(1, EstadoMesa.Ocupada);

    state.mostrarNotificacion('test', 'exito');
    expect(mesaLecturaStateMock.mostrarNotificacion).toHaveBeenCalledWith('test', 'exito');
  });

  it('debería cambiar modo editor y crear backup', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, numeroMesa: 1 } as Mesa]);
    expect(state.isEditorMode()).toBe(false);
    
    state.toggleEditorMode();
    
    expect(state.isEditorMode()).toBe(true);
    expect(mesaLecturaStateMock.seleccionarMesa).toHaveBeenCalledWith(null);
  });

  it('debería cancelar edición y restaurar backup', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, numeroMesa: 1 } as Mesa]);
    state.toggleEditorMode();
    
    mesaLecturaStateMock.mesas.set([{ id: 1, numeroMesa: 2 } as Mesa]);
    state.cancelarEdicion();
    
    expect(state.isEditorMode()).toBe(false);
    expect(mesaLecturaStateMock.setMesas).toHaveBeenCalled();
    // Vuelve al original
    expect(mesaLecturaStateMock.mesas()[0].numeroMesa).toBe(1);
  });

  it('debería mover mesa', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, posicionXInicio: 10, posicionXFin: 20, posicionYInicio: 10, posicionYFin: 20 } as Mesa]);
    
    state.moverMesa(1, 5, 5);
    
    const mesasModificadas = mesaLecturaStateMock.mesas();
    expect(mesasModificadas[0].posicionXInicio).toBe(15);
    expect(mesasModificadas[0].posicionYInicio).toBe(15);
  });

  it('debería agregar objeto fijo', () => {
    state.agregarObjetoFijo();
    const mesas = mesaLecturaStateMock.mesas();
    expect(mesas.length).toBe(1);
    expect(mesas[0].textoObjeto).toBe('Escenario');
    expect(mesas[0].id).toBeLessThan(0);
  });

  it('debería agregar mesa', () => {
    state.agregarMesa(FormaMesa.Cuadrada);
    const mesas = mesaLecturaStateMock.mesas();
    expect(mesas.length).toBe(1);
    expect(mesas[0].numeroMesa).toBe(1);
    expect(mesas[0].id).toBeLessThan(0);
  });

  it('debería eliminar mesa si está disponible', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, estadoMesa: EstadoMesa.Disponible } as Mesa]);
    state.eliminarMesa(1);
    expect(mesaLecturaStateMock.mesas().length).toBe(0);
  });

  it('no debería eliminar mesa si NO está disponible', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, estadoMesa: EstadoMesa.Ocupada } as Mesa]);
    state.eliminarMesa(1);
    expect(mesaLecturaStateMock.mesas().length).toBe(1);
    expect(mesaLecturaStateMock.mostrarNotificacion).toHaveBeenCalledWith('No se puede eliminar una mesa ocupada o con comandas activas', 'error');
  });

  it('debería actualizar número de mesa', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, numeroMesa: 1 } as Mesa]);
    state.actualizarNumero(1, 5);
    expect(mesaLecturaStateMock.mesas()[0].numeroMesa).toBe(5);
  });

  it('debería validar límites espaciales al guardar', () => {
    mesaLecturaStateMock.mesas.set([{ id: 1, posicionXInicio: 3500, posicionXFin: 3600, posicionYInicio: 10, posicionYFin: 20 } as Mesa]);
    state.guardarConfiguracion();
    expect(mesaLecturaStateMock.mostrarNotificacion).toHaveBeenCalledWith(expect.stringMatching('fuera del límite'), 'error');
    expect(mesaServiceMock.guardarMapa).not.toHaveBeenCalled();
  });

  it('debería validar superposición al guardar', () => {
    mesaLecturaStateMock.mesas.set([
      { id: 1, numeroMesa: 1, posicionXInicio: 10, posicionXFin: 50, posicionYInicio: 10, posicionYFin: 50 } as Mesa,
      { id: 2, numeroMesa: 2, posicionXInicio: 40, posicionXFin: 80, posicionYInicio: 40, posicionYFin: 80 } as Mesa
    ]);
    state.guardarConfiguracion();
    expect(mesaLecturaStateMock.mostrarNotificacion).toHaveBeenCalledWith(expect.stringMatching('están superpuestas'), 'error');
    expect(mesaServiceMock.guardarMapa).not.toHaveBeenCalled();
  });

  it('debería guardar mapa con éxito si todo está bien', () => {
    mesaLecturaStateMock.mesas.set([
      { id: 1, numeroMesa: 1, posicionXInicio: 10, posicionXFin: 50, posicionYInicio: 10, posicionYFin: 50 } as Mesa
    ]);
    mesaServiceMock.guardarMapa.mockReturnValue(of(void 0));
    
    state.toggleEditorMode();
    state.guardarConfiguracion();
    
    expect(mesaServiceMock.guardarMapa).toHaveBeenCalled();
    expect(state.isEditorMode()).toBe(false);
    expect(mesaLecturaStateMock.mostrarNotificacion).toHaveBeenCalledWith('Mapa guardado con éxito', 'exito');
  });

  it('debería mostrar error si guardar mapa falla', () => {
    mesaLecturaStateMock.mesas.set([
      { id: 1, numeroMesa: 1, posicionXInicio: 10, posicionXFin: 50, posicionYInicio: 10, posicionYFin: 50 } as Mesa
    ]);
    mesaServiceMock.guardarMapa.mockReturnValue(throwError(() => ({ error: { error: 'Error del backend' } })));
    
    state.guardarConfiguracion();
    
    expect(mesaLecturaStateMock.mostrarNotificacion).toHaveBeenCalledWith('Error del backend', 'error');
  });
});
