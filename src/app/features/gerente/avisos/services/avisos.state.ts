import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Aviso, AvisoTipo } from '../../../../core/models/domain/aviso';
import { Plato } from '../../../../core/models/domain/plato';
import { AvisosApiService } from './avisos.api';
import { Sugerencia, PlatoSugerido } from '../../../../core/models/domain/sugerencia-ia';
import { mapAvisosResponseToDomain } from '../../../../infra/http/mappers/aviso.mapper';
import { crearPlatoSugeridoRequest, filtrarAvisos, filtrarSugerenciasCocina } from './avisos.rules';
@Injectable({ providedIn: 'root' })
export class AvisosStateService {
  private api = inject(AvisosApiService);
  private destroyRef = inject(DestroyRef);

  readonly #mensaje = signal<string | null>(null);
  readonly #searchTerm = signal<string>('');
  readonly #loadingSugerenciasCocina = signal<boolean>(false);
  readonly #sugerenciasCocina = signal<Plato[]>([]);
  readonly #sugerenciasIgnoradas = signal<number[]>([]);
  readonly #platoAgregadoACarta = signal<Plato | null>(null);

  readonly #vencimientos = signal<Aviso[]>([]);
  readonly #stockBajo = signal<Aviso[]>([]);
  readonly #sugerenciasIA = signal<Sugerencia | null>(null);
  readonly #loadingIA = signal<boolean>(false);
  readonly #errorIA = signal<string | null>(null);
  readonly #creandoPlato = signal<number | null>(null);
  readonly #platoIACreado = signal<string | null>(null);

  mensaje = this.#mensaje.asReadonly();
  searchTerm = this.#searchTerm.asReadonly();
  loadingSugerenciasCocina = this.#loadingSugerenciasCocina.asReadonly();
  platoAgregadoACarta = this.#platoAgregadoACarta.asReadonly();
  sugerenciasIA = this.#sugerenciasIA.asReadonly();
  loadingIA = this.#loadingIA.asReadonly();
  errorIA = this.#errorIA.asReadonly();
  creandoPlato = this.#creandoPlato.asReadonly();
  platoIACreado = this.#platoIACreado.asReadonly();

  vencimientos = computed(() => {
    return filtrarAvisos(this.#vencimientos(), this.#searchTerm());
  });

  stockBajo = computed(() => {
    return filtrarAvisos(this.#stockBajo(), this.#searchTerm());
  });

  sugerencias = computed(() => {
    return filtrarSugerenciasCocina(this.#sugerenciasCocina(), this.#sugerenciasIgnoradas(), this.#searchTerm());
  });

  cargarAvisos(): void {
    forkJoin({
      avisos: this.api.getAvisos(),
      insumos: this.api.getInsumos()
    })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ({ avisos, insumos }) => {
            const insumosMap = new Map(insumos.map(i => [i.id, i]));
            const { vencimientos, stockBajo } = mapAvisosResponseToDomain(avisos, insumosMap);
            
            this.#stockBajo.set(stockBajo);
            this.#vencimientos.set(vencimientos);
          },
          error: (err) => console.error('Error al cargar avisos:', err)
        });
  }

  cargarSugerenciasCocina(): void {
    this.#loadingSugerenciasCocina.set(true);
    this.api.getPlatos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: platos => {
          this.#sugerenciasCocina.set(platos);
          this.#loadingSugerenciasCocina.set(false);
        },
        error: () => this.#loadingSugerenciasCocina.set(false)
      });
  }

  setSearchTerm(term: string) {
    this.#searchTerm.set(term);
  }

  marcarRevisado(type: AvisoTipo, id: string) {
    if (type === 'vencimiento') this.#vencimientos.update(list => list.filter(a => a.id !== id));
    if (type === 'stock') this.#stockBajo.update(list => list.filter(a => a.id !== id));
    this.mostrarMensaje('Acción realizada');
  }

  avisarCocina(id: string) {
    this.#vencimientos.update(list => list.filter(a => a.id !== id));
    this.mostrarMensaje('Cocina notificada');
  }

  crearPedido(id: string) {
    this.#stockBajo.update(list => list.filter(a => a.id !== id));
    this.mostrarMensaje('Pedido creado');
  }

  agregarSugerenciaACarta(plato: Plato): void {
    this.#sugerenciasCocina.update(platos =>
      platos.map(item => item.id === plato.id ? { ...item, visible: true } : item)
    );

    this.api.updatePlato(plato.id, { visible: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.#sugerenciasCocina.update(platos =>
            platos.map(item => item.id === plato.id ? updated : item)
          );
          this.#platoAgregadoACarta.set(updated);
        },
        error: () => {
          this.#sugerenciasCocina.update(platos =>
            platos.map(item => item.id === plato.id ? { ...item, visible: false } : item)
          );
        }
      });
  }

  ignorarSugerencia(plato: Plato): void {
    this.#sugerenciasIgnoradas.update(ids => [...ids, plato.id]);
    this.mostrarMensaje('Sugerencia descartada');
  }

  cerrarConfirmacionCarta(): void {
    this.#platoAgregadoACarta.set(null);
  }

  marcarTodoRevisado() {
    this.#vencimientos.set([]);
    this.#stockBajo.set([]);
    this.#sugerenciasIgnoradas.set(this.#sugerenciasCocina().map(plato => plato.id));
    this.mostrarMensaje('Todos los avisos marcados');
  }

  private mostrarMensaje(msg: string) {
    this.#mensaje.set(msg);
    setTimeout(() => this.#mensaje.set(null), 2500);
  }

  generarSugerenciasIA(): void {
    this.#loadingIA.set(true);
    this.#errorIA.set(null);
    this.#sugerenciasIA.set(null);

    this.api.generarSugerenciasIA()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.#sugerenciasIA.set(resultado);
          this.#loadingIA.set(false);
        },
        error: () => {
          this.#errorIA.set('No se pudo generar la sugerencia. Intentá de nuevo.');
          this.#loadingIA.set(false);
        }
      });
  }

  crearPlatoDesdeIA(plato: PlatoSugerido): void {
  this.#creandoPlato.set(plato.id);

  const request = crearPlatoSugeridoRequest(plato);

  this.api.crearPlatoDesdeIA(request)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.#creandoPlato.set(null);
        this.#platoIACreado.set(plato.nombre);
        setTimeout(() => this.#platoIACreado.set(null), 3000);
      },
      error: () => {
        this.#creandoPlato.set(null);
        this.mostrarMensaje('No se pudo crear el plato. Intentá de nuevo.');
      }
    });
}
}
