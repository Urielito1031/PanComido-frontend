import { inject, Injectable, DestroyRef, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Empleado, EmpleadoNuevo, EmpleadoEdicion } from '../../../core/models/domain/empleado';
import { TurnoLaboral } from '../../../core/models/domain/turno-laboral';
import { EmpleadoApiService } from './empleado.api';
import { ConfiguracionService } from '../configuracion/services/configuracion-service';

@Injectable({
  providedIn: 'root'
})
export class UsuariosState {
  private readonly api = inject(EmpleadoApiService);
  private readonly configApi = inject(ConfiguracionService);
  private readonly destroyRef = inject(DestroyRef);

  // States (Signals)
  readonly #empleados = signal<Empleado[]>([]);
  readonly #turnos = signal<TurnoLaboral[]>([]);
  readonly #loading = signal(false);
  readonly #guardando = signal(false);
  readonly #error = signal<string | null>(null);
  readonly #exito = signal<string | null>(null);

  // Selection
  readonly usuarioSeleccionadoId = signal<number | null>(null);

  // Filters (Signals)
  readonly termino = signal('');
  readonly filtroRol = signal<'Todos' | 'Gerente' | 'Mozo' | 'Cocina'>('Todos');
  readonly filtroEstado = signal<'Todos' | 'activo' | 'inactivo'>('Todos');

  // Readonly exposures
  readonly empleados = this.#empleados.asReadonly();
  readonly turnos = this.#turnos.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly guardando = this.#guardando.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly exito = this.#exito.asReadonly();

  // Computed selection
  readonly usuarioSeleccionado = computed(() => {
    const id = this.usuarioSeleccionadoId();
    if (id === null) return null;
    return this.#empleados().find(e => e.id === id) || null;
  });

  // Computed selector
  readonly empleadosFiltrados = computed(() => {
    const q = this.termino().toLowerCase().trim();
    const rol = this.filtroRol();
    const estado = this.filtroEstado();
    let lista = this.#empleados();

    if (q) {
      lista = lista.filter(e =>
        e.nombre.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q)
      );
    }

    if (rol !== 'Todos') {
      lista = lista.filter(e => e.rol === rol);
    }

    if (estado !== 'Todos') {
      lista = lista.filter(e => e.estado === estado);
    }

    return lista;
  });

  cargarDatos(): void {
    this.#loading.set(true);
    this.#error.set(null);

    forkJoin({
      empleados: this.api.getEmpleados(),
      turnos: this.configApi.obtenerTurnos().pipe(catchError(() => of([] as TurnoLaboral[])))
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ empleados, turnos }) => {
          this.#empleados.set(empleados);
          this.#turnos.set(turnos);
          if (empleados.length > 0 && this.usuarioSeleccionadoId() === null) {
            this.usuarioSeleccionadoId.set(empleados[0].id);
          }
          this.#loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.#error.set('Error al cargar la información de empleados y turnos');
          this.#loading.set(false);
        }
      });
  }

  crearEmpleado(empleado: EmpleadoNuevo, alFinalizar?: () => void): void {
    this.#guardando.set(true);
    this.#error.set(null);
    this.#exito.set(null);

    this.api.crearEmpleado(empleado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.#empleados.update(lista => [...lista, res.empleado]);
          this.#exito.set(res.mensaje || 'Empleado creado correctamente');
          this.#guardando.set(false);
          if (alFinalizar) alFinalizar();
        },
        error: (err) => {
          console.error(err);
          this.#error.set(err.error?.mensaje || 'Error al intentar crear el empleado');
          this.#guardando.set(false);
        }
      });
  }

  actualizarEmpleado(id: number, empleado: EmpleadoEdicion, alFinalizar?: () => void): void {
    this.#guardando.set(true);
    this.#error.set(null);
    this.#exito.set(null);

    this.api.modificarEmpleado(id, empleado)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.#empleados.update(lista =>
            lista.map(e => e.id === id ? res.empleado : e)
          );
          this.#exito.set(res.mensaje || 'Empleado modificado correctamente');
          this.#guardando.set(false);
          if (alFinalizar) alFinalizar();
        },
        error: (err) => {
          console.error(err);
          this.#error.set(err.error?.mensaje || 'Error al intentar modificar el empleado');
          this.#guardando.set(false);
        }
      });
  }

  eliminarEmpleado(id: number, alFinalizar?: () => void): void {
    this.#guardando.set(true);
    this.#error.set(null);
    this.#exito.set(null);

    this.api.eliminarEmpleado(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.#empleados.update(lista => {
            const nueva = lista.filter(e => e.id !== id);
            if (this.usuarioSeleccionadoId() === id) {
              this.usuarioSeleccionadoId.set(nueva.length > 0 ? nueva[0].id : null);
            }
            return nueva;
          });
          this.#exito.set(res.mensaje || 'Empleado eliminado correctamente');
          this.#guardando.set(false);
          if (alFinalizar) alFinalizar();
        },
        error: (err) => {
          console.error(err);
          this.#error.set(err.error?.mensaje || 'Error al intentar eliminar el empleado');
          this.#guardando.set(false);
        }
      });
  }

  limpiarFeedback(): void {
    this.#error.set(null);
    this.#exito.set(null);
  }
}
