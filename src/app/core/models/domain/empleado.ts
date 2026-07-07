import { TurnoLaboral } from './turno-laboral';

export interface Empleado {
  id: number;
  nombre: string;
  email: string;
  estado: 'activo' | 'inactivo';
  rol: 'Gerente' | 'Mozo' | 'Cocina';
  turnos: TurnoLaboral[];
}

export interface EmpleadoNuevo {
  nombre: string;
  email: string;
  contrasenia: string;
  estado: 'activo' | 'inactivo';
  rol: 'Gerente' | 'Mozo' | 'Cocina';
  turnosIds: number[];
}

export interface EmpleadoEdicion {
  nombre: string;
  email: string;
  contrasenia: string | null;
  estado: 'activo' | 'inactivo';
  rol: 'Gerente' | 'Mozo' | 'Cocina';
  turnosIds: number[];
}
