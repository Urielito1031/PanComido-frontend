import { TurnoLaboral } from './turno-laboral';

export type RolEmpleado = 'Gerente' | 'Mozo' | 'Cocina';
export type EstadoEmpleado = 'activo' | 'inactivo';

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  estado: EstadoEmpleado;
  rol: RolEmpleado;
  turnos: TurnoLaboral[];
}

export interface EmpleadoNuevo {
  nombre: string;
  email: string;
  contrasenia: string;
  estado: EstadoEmpleado;
  rol: RolEmpleado;
  turnosIds: number[];
}

export interface EmpleadoEdicion {
  nombre: string;
  email: string;
  contrasenia: string | null;
  estado: EstadoEmpleado;
  rol: RolEmpleado;
  turnosIds: number[];
}
