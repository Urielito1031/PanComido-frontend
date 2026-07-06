import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { UsuariosPage } from './usuarios-page';
import { UsuariosState } from '../../../services/usuarios-state';
import { Empleado } from '../../../../../core/models/domain/empleado';
import { TurnoLaboral } from '../../../../../core/models/domain/turno-laboral';
import { UsuariosTourService } from '../../../services/usuarios-tour.service';
import { vi } from 'vitest';

describe('UsuariosPage', () => {
  let component: UsuariosPage;
  let fixture: ComponentFixture<UsuariosPage>;
  let mockState: any;
  let empleado: Empleado;

  beforeEach(async () => {
    empleado = {
      id: 1,
      nombre: 'Ana Gomez',
      email: 'ana@pancomido.com',
      rol: 'Mozo',
      estado: 'activo',
      turnos: [{ id: 10, horarioInicio: '08:00:00', horarioFin: '16:00:00', esNocturno: false }]
    } as Empleado;

    mockState = {
      termino: signal(''),
      filtroRol: signal('Todos'),
      filtroEstado: signal('Todos'),
      empleados: signal<Empleado[]>([empleado]),
      turnos: signal<TurnoLaboral[]>(empleado.turnos),
      loading: signal(false),
      guardando: signal(false),
      error: signal<string | null>(null),
      exito: signal<string | null>(null),
      usuarioSeleccionadoId: signal<number | null>(null),
      usuarioSeleccionado: signal<Empleado | null>(null),
      empleadosFiltrados: signal<Empleado[]>([empleado]),
      cargarDatos: vi.fn(),
      limpiarFeedback: vi.fn(),
      crearEmpleado: vi.fn(),
      actualizarEmpleado: vi.fn(),
      eliminarEmpleado: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [
        { provide: UsuariosState, useValue: mockState },
        { provide: UsuariosTourService, useValue: { haVistoElTutorial: vi.fn().mockReturnValue(true), iniciarTour: vi.fn() } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deberia crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería cargar datos y renderizar usuarios con badges y fila seleccionable', () => {
    expect(mockState.cargarDatos).toHaveBeenCalled();
    expect(fixture.debugElement.query(By.css('.counter-pill')).nativeElement.textContent).toContain('1 usuarios');
    expect(fixture.debugElement.query(By.css('.usuario-nombre')).nativeElement.textContent).toContain('Ana Gomez');

    fixture.debugElement.query(By.css('.usuario-row')).triggerEventHandler('click');

    expect(mockState.usuarioSeleccionadoId()).toBe(1);
  });

  it('debería actualizar búsqueda y filtros', () => {
    component.onSearch('ana');
    component.setFiltroRol('Mozo');
    component.setFiltroEstado('activo');

    expect(mockState.termino()).toBe('ana');
    expect(mockState.filtroRol()).toBe('Mozo');
    expect(mockState.filtroEstado()).toBe('activo');
  });

  it('debería exponer helpers visuales de avatar y turnos', () => {
    expect(component.getAvatarColor('Gerente')).toBe('#D8081C');
    expect(component.getAvatarColor('Cocina')).toBe('#F08F1A');
    expect(component.getAvatarColor('Mozo')).toBe('#02596C');
    expect(component.getAvatarText('Ana Gomez')).toBe('AG');
    expect(component.getAvatarText('Sol')).toBe('SO');
    expect(component.getTurnoLabel({ id: 2, horarioInicio: '22:00:00', horarioFin: '06:00:00', esNocturno: true } as TurnoLaboral)).toBe('22:00 - 06:00 (Nocturno)');
  });

  it('debería marcar formulario inválido y no guardar', () => {
    component.userForm.reset({
      nombre: '',
      email: 'mal',
      contrasenia: '',
      estado: 'activo',
      rol: 'Mozo'
    });

    component.guardarUsuario();

    expect(component.userForm.get('nombre')?.touched).toBe(true);
    expect(mockState.crearEmpleado).not.toHaveBeenCalled();
    expect(mockState.actualizarEmpleado).not.toHaveBeenCalled();
  });

  it('debería alternar turnos seleccionados', () => {
    component.toggleTurno(10);
    expect(component.turnosSeleccionadosIds()).toEqual([10]);

    component.toggleTurno(10);
    expect(component.turnosSeleccionadosIds()).toEqual([]);
  });
});
