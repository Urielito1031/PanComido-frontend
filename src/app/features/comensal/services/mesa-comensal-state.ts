import { computed, inject, Injectable, signal } from '@angular/core';
import { MesaComensalService } from './mesa-comensal.service';
import { BienvenidaResponseDto } from '../../../core/models/dtos/responses/bienvenida.response';

@Injectable({
  providedIn: 'root',
})
export class MesaComensalState {
  private service = inject(MesaComensalService);

  readonly #bienvenidaInvitado = signal<any | null>(null);
  readonly bienvenidaInvitado = this.#bienvenidaInvitado.asReadonly();

  readonly #bienvenida = signal<BienvenidaResponseDto | null>(null);
  readonly #cargando = signal(false);
  readonly #error = signal<string | null>(null);
  readonly bienvenida = this.#bienvenida.asReadonly();
  readonly cargando = this.#cargando.asReadonly();
  readonly error = this.#error.asReadonly();
 
  readonly mesaId = computed(() => this.#bienvenida()?.idMesa ?? null);
  readonly numeroMesa = computed(() => this.#bienvenida()?.numeroMesa ?? null);
  readonly restauranteIdBienvenida = computed(() => this.#bienvenida()?.restauranteId ?? null);

  readonly cantidadMaximaComensales = computed(() => this.#bienvenida()?.cantidadMaximaComensales ?? null,);
  readonly estadoActual = computed(() => this.#bienvenida()?.estadoActual ?? null);

  readonly bienvenidaCargada = computed(() => this.#bienvenida() !== null);
  readonly mesaDisponible = computed(() => this.#bienvenida()?.estadoActual === 'Disponible');
  readonly tieneError = computed(() => this.#error() !== null);
  readonly comandaIdInvitado = computed(() => this.#bienvenidaInvitado()?.comandaId ?? null);
  readonly mesaIdInvitado = computed(() => this.#bienvenidaInvitado()?.idMesa ?? null);
  readonly numeroMesaInvitado = computed(() => this.#bienvenidaInvitado()?.numeroMesa ?? null);
  readonly cantComensalesInvitado = computed(() => this.#bienvenidaInvitado()?.cantComensales ?? null);
  readonly restauranteIdInvitado = computed(() => this.#bienvenidaInvitado()?.restauranteId ?? null);
  readonly bienvenidaInvitadoCargada = computed(() => this.#bienvenidaInvitado() !== null);

  
  cargarBienvenida(mesaId: number, restauranteId: number): void {
    console.log("cargarBienvenida metodo en state: ",mesaId);
    this.#cargando.set(true);
    this.#error.set(null);
    
    this.service.obtenerBienvenida(mesaId, restauranteId).subscribe({
      next: (data) => {
        this.#bienvenida.set(data);
        console.log("data de bienvenida desde mesa-comensal-state: ",data)
        this.#cargando.set(false);
      },
      error: (err) => {
        this.#error.set(err.error?.error ?? err.message ?? 'Error al cargar la mesa');
        this.#cargando.set(false);
      },
    });
  }

  cargarBienvenidaInvitado(comandaId: number): void {
    this.#cargando.set(true);
    this.#error.set(null);
  
    this.service.obtenerBienvenidaInvitado(comandaId).subscribe({
      next: (data) => {
        this.#bienvenidaInvitado.set(data);
        console.log("Bienvenida invidado data: ",data)
        this.#cargando.set(false);
      },
      error: (err) => {
        this.#error.set(err.error?.mensaje ?? err.message ?? 'Error al cargar invitación');
        this.#cargando.set(false);
      },
    });
  }
}
