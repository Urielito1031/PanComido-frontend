import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { UsuariosPage } from './usuarios-page';
import { UsuariosState } from '../../../services/usuarios-state';
import { Empleado } from '../../../../../core/models/domain/empleado';
import { TurnoLaboral } from '../../../../../core/models/domain/turno-laboral';

describe('UsuariosPage', () => {
  let component: UsuariosPage;
  let fixture: ComponentFixture<UsuariosPage>;
  let mockState: any;

  beforeEach(async () => {
    mockState = {
      termino: signal(''),
      filtroRol: signal('Todos'),
      filtroEstado: signal('Todos'),
      empleados: signal<Empleado[]>([]),
      turnos: signal<TurnoLaboral[]>([]),
      loading: signal(false),
      guardando: signal(false),
      error: signal<string | null>(null),
      exito: signal<string | null>(null),
      usuarioSeleccionadoId: signal<number | null>(null),
      usuarioSeleccionado: signal<Empleado | null>(null),
      empleadosFiltrados: signal<Empleado[]>([]),
      cargarDatos: vi.fn(),
      limpiarFeedback: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [UsuariosPage],
      providers: [
        { provide: UsuariosState, useValue: mockState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deberia crear el componente', () => {
    expect(component).toBeTruthy();
  });
});
