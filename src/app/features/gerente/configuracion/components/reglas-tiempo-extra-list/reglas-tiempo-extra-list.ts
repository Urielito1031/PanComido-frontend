import { Component, inject, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../services/configuracion-service';
import { ReglaTiempoExtra } from '../../../../../core/models/domain/regla-tiempo-extra';

@Component({
  selector: 'app-reglas-tiempo-extra-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reglas-tiempo-extra-list.html',
  styleUrl: './reglas-tiempo-extra-list.css'
})
export class ReglasTiempoExtraList implements OnInit {
  private service = inject(ConfiguracionService);

  cambio = output<void>();

  reglas = signal<ReglaTiempoExtra[]>([]);
  cargando = signal(false);

  // Estados visuales por fila
  guardandoId = signal<number | null>(null);
  exitoId = signal<number | null>(null);
  confirmandoBorradoId = signal<number | null>(null);
  editandoId = signal<number | null>(null);
  errorMensaje = signal<string | null>(null);
  agregando = signal(false);

  // Backup para poder cancelar la edición
  private valoresOriginales: { [id: number]: { porcentaje: number, minutos: number } } = {};

  // Variables para crear una nueva
  nuevoPorcentaje: number | null = null;
  nuevosMinutos: number | null = null;

  ngOnInit(): void {
    this.cargarReglas();
  }

  private ordenar(reglas: ReglaTiempoExtra[]): ReglaTiempoExtra[] {
    return [...reglas].sort((a, b) => a.porcentajeOcupacionHasta - b.porcentajeOcupacionHasta);
  }

  cargarReglas() {
    this.cargando.set(true);
    this.service.obtenerReglasTiempoExtra().subscribe({
      next: (data) => {
        this.reglas.set(this.ordenar(data));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  private manejarError(err: any) {
    this.guardandoId.set(null);
    this.agregando.set(false);
    const mensaje = err.error?.error || 'No se pudo guardar la regla. Verificá que el porcentaje no exista ya.';
    this.errorMensaje.set(mensaje);
    setTimeout(() => this.errorMensaje.set(null), 4500);
  }

  agregarRegla() {
    if (this.nuevoPorcentaje === null || this.nuevosMinutos === null) return;

    if (this.nuevoPorcentaje > 100 || this.nuevoPorcentaje < 0) {
      this.errorMensaje.set('El porcentaje de ocupación debe estar entre 0 y 100.');
      setTimeout(() => this.errorMensaje.set(null), 4500);
      return;
    }

    this.agregando.set(true);
    this.service.crearReglaTiempoExtra({
      porcentajeOcupacionHasta: this.nuevoPorcentaje,
      minutosExtra: this.nuevosMinutos
    }).subscribe({
      next: (nueva) => {
        this.reglas.update(rs => this.ordenar([...rs, nueva]));
        this.nuevoPorcentaje = null;
        this.nuevosMinutos = null;
        this.agregando.set(false);
        this.cambio.emit();
      },
      error: (err) => this.manejarError(err)
    });
  }

  iniciarEdicion(regla: ReglaTiempoExtra) {
    this.valoresOriginales[regla.id] = {
      porcentaje: regla.porcentajeOcupacionHasta,
      minutos: regla.minutosExtra
    };
    this.editandoId.set(regla.id);
    this.confirmandoBorradoId.set(null); // oculta el de borrar si estaba abierto
  }

  cancelarEdicion(regla: ReglaTiempoExtra) {
    const orig = this.valoresOriginales[regla.id];
    if (orig) {
      regla.porcentajeOcupacionHasta = orig.porcentaje;
      regla.minutosExtra = orig.minutos;
    }
    this.editandoId.set(null);
  }

  actualizarRegla(regla: ReglaTiempoExtra) {
    if (regla.porcentajeOcupacionHasta > 100 || regla.porcentajeOcupacionHasta < 0) {
      this.errorMensaje.set('El porcentaje de ocupación debe estar entre 0 y 100.');
      setTimeout(() => this.errorMensaje.set(null), 4500);
      return;
    }

    this.guardandoId.set(regla.id);
    this.service.actualizarReglaTiempoExtra(regla.id, {
      porcentajeOcupacionHasta: regla.porcentajeOcupacionHasta,
      minutosExtra: regla.minutosExtra
    }).subscribe({
      next: () => {
        this.guardandoId.set(null);
        this.editandoId.set(null);
        this.exitoId.set(regla.id);
        this.reglas.update(rs => this.ordenar(rs)); // Reordena si cambió el porcentaje
        this.cambio.emit();
        setTimeout(() => {
          if (this.exitoId() === regla.id) this.exitoId.set(null);
        }, 1500); // El color verde dura 1.5 seg
      },
      error: (err) => this.manejarError(err)
    });
  }

  iniciarEliminacion(id: number) {
    this.confirmandoBorradoId.set(id);
    this.editandoId.set(null); // oculta el de editar si estaba abierto
  }

  cancelarEliminacion() {
    this.confirmandoBorradoId.set(null);
  }

  eliminarRegla(id: number) {
    this.guardandoId.set(id);
    this.service.eliminarReglaTiempoExtra(id).subscribe({
      next: () => {
        this.reglas.update(rs => rs.filter(r => r.id !== id));
        this.guardandoId.set(null);
        this.confirmandoBorradoId.set(null);
        this.cambio.emit();
      },
      error: (err) => this.manejarError(err)
    });
  }
}
