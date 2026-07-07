import { ChangeDetectionStrategy, Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuariosState } from '../../../services/usuarios-state';
import { Empleado, EmpleadoNuevo, EmpleadoEdicion } from '../../../../../core/models/domain/empleado';
import { TurnoLaboral } from '../../../../../core/models/domain/turno-laboral';
import { Buscador } from '../../../../../shared/ui/buscador/buscador';
import { Boton } from '../../../../../shared/ui/botones/boton/boton';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { PillChip } from '../../../../../shared/ui/pill-chip/pill-chip';
import { PageToolbar } from '../../../../../shared/ui/page-toolbar/page-toolbar';
import { GlassCard } from '../../../../../shared/ui/glass-card/glass-card';
import { UsuariosTourService } from '../../../services/usuarios-tour.service';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Buscador, Boton, Modal, PillChip, PageToolbar, GlassCard],
  templateUrl: './usuarios-page.html',
  styleUrl: './usuarios-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsuariosPage implements OnInit {
  readonly state = inject(UsuariosState);
  private readonly fb = inject(FormBuilder);
  private readonly tour = inject(UsuariosTourService);

  // References to modals
  readonly formModal = viewChild.required<Modal>('formModal');
  readonly confirmDeleteModal = viewChild.required<Modal>('confirmDeleteModal');

  // Page States
  readonly empleadoEditando = signal<Empleado | null>(null);
  readonly empleadoAEliminar = signal<Empleado | null>(null);
  readonly turnosSeleccionadosIds = signal<number[]>([]);
  readonly mostrarContrasenia = signal(false);

  // Form definition
  readonly userForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    contrasenia: [''],
    estado: ['activo', [Validators.required]],
    rol: ['Mozo', [Validators.required]]
  });

  ngOnInit(): void {
    this.state.cargarDatos();
    if (!this.tour.haVistoElTutorial()) {
      setTimeout(() => this.tour.iniciarTour(), 1200);
    }
  }

  onSearch(termino: string): void {
    this.state.termino.set(termino);
  }

  setFiltroRol(rol: 'Todos' | 'Gerente' | 'Mozo' | 'Cocina'): void {
    this.state.filtroRol.set(rol);
  }

  setFiltroEstado(estado: 'Todos' | 'activo' | 'inactivo'): void {
    this.state.filtroEstado.set(estado);
  }

  abrirCrearUsuario(): void {
    this.state.limpiarFeedback();
    this.empleadoEditando.set(null);
    this.turnosSeleccionadosIds.set([]);
    
    // Contrasenia is required when creating
    this.userForm.get('contrasenia')?.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(128)]);
    this.userForm.reset({
      nombre: '',
      email: '',
      contrasenia: '',
      estado: 'activo',
      rol: 'Mozo'
    });
    this.userForm.get('contrasenia')?.updateValueAndValidity();
    
    this.formModal().abrir();
  }

  abrirEditarUsuario(empleado: Empleado): void {
    this.state.limpiarFeedback();
    this.empleadoEditando.set(empleado);
    this.turnosSeleccionadosIds.set(empleado.turnos.map(t => t.id));

    // Contrasenia is optional when editing
    this.userForm.get('contrasenia')?.setValidators([Validators.minLength(8), Validators.maxLength(128)]);
    this.userForm.reset({
      nombre: empleado.nombre,
      email: empleado.email,
      contrasenia: '',
      estado: empleado.estado,
      rol: empleado.rol
    });
    this.userForm.get('contrasenia')?.updateValueAndValidity();

    this.formModal().abrir();
  }

  toggleTurno(turnoId: number): void {
    this.turnosSeleccionadosIds.update(ids =>
      ids.includes(turnoId) ? ids.filter(id => id !== turnoId) : [...ids, turnoId]
    );
  }

  guardarUsuario(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formVal = this.userForm.value;
    const editando = this.empleadoEditando();

    const normalizarTexto = (val?: string | null) => val ? val.trim().replace(/\s+/g, ' ') : '';
    const nombreNormalizado = normalizarTexto(formVal.nombre);
    const emailNormalizado = normalizarTexto(formVal.email);
    const contraseniaNormalizada = formVal.contrasenia?.trim() || null;

    if (editando) {
      const payload: EmpleadoEdicion = {
        nombre: nombreNormalizado,
        email: emailNormalizado,
        contrasenia: contraseniaNormalizada,
        estado: formVal.estado as 'activo' | 'inactivo',
        rol: formVal.rol as 'Gerente' | 'Mozo' | 'Cocina',
        turnosIds: this.turnosSeleccionadosIds()
      };
      this.state.actualizarEmpleado(editando.id, payload, () => {
        this.formModal().cerrar();
      });
    } else {
      const payload: EmpleadoNuevo = {
        nombre: nombreNormalizado,
        email: emailNormalizado,
        contrasenia: contraseniaNormalizada || '',
        estado: formVal.estado as 'activo' | 'inactivo',
        rol: formVal.rol as 'Gerente' | 'Mozo' | 'Cocina',
        turnosIds: this.turnosSeleccionadosIds()
      };
      this.state.crearEmpleado(payload, () => {
        this.formModal().cerrar();
      });
    }
  }

  abrirEliminarUsuario(empleado: Empleado): void {
    this.state.limpiarFeedback();
    this.empleadoAEliminar.set(empleado);
    this.confirmDeleteModal().abrir();
  }

  confirmarEliminarUsuario(): void {
    const empleado = this.empleadoAEliminar();
    if (!empleado) return;

    this.state.eliminarEmpleado(empleado.id, () => {
      this.confirmDeleteModal().cerrar();
      this.empleadoAEliminar.set(null);
    });
  }

  getTurnoLabel(turno: TurnoLaboral): string {
    const inicio = turno.horarioInicio.substring(0, 5);
    const fin = turno.horarioFin.substring(0, 5);
    return `${inicio} - ${fin}${turno.esNocturno ? ' (Nocturno)' : ''}`;
  }

  seleccionarUsuario(usuario: Empleado): void {
    this.state.usuarioSeleccionadoId.set(usuario.id);
  }

  iniciarTour(): void {
    this.tour.iniciarTour();
  }

  getAvatarColor(rol: string): string {
    if (rol === 'Gerente') return '#D8081C';
    if (rol === 'Cocina') return '#F08F1A';
    return '#02596C';
  }

  getAvatarText(nombre: string): string {
    const partes = nombre.split(' ');
    if (partes.length >= 2) {
      return (partes[0].charAt(0) + partes[1].charAt(0)).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }
}
