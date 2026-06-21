import { computed, effect, inject, Injectable, signal, DestroyRef } from '@angular/core';
import { ConfiguracionVisualService } from './configuracion-visual-service';
import { ConfiguracionVisual } from '../../../../core/models/domain/configuracion-visual';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionVisualState {
  private readonly STORAGE_KEY = 'pancomido-visual-config';
  private service = inject(ConfiguracionVisualService);
  private destroyRef = inject(DestroyRef);

   #configuracionVisual = signal<ConfiguracionVisual | null>(null);
   #cargando = signal(false);
   #error = signal<string| null>(null);
   #cargado = false;

  readonly cargando = this.#cargando.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly colorPrimario = computed(() => this.#configuracionVisual()?.colorPrincipal);
  readonly colorSecundario = computed(() => this.#configuracionVisual()?.colorSecundario);
  readonly nombreLocal = computed(() => this.#configuracionVisual()?.nombre);
  readonly logoUrl = computed(() => this.#configuracionVisual()?.imagen);
  readonly fontTitulo = computed(() => {
    const f = this.#configuracionVisual()?.tipografiaTitulo;
    return f ? `${f}, sans-serif` : 'system-ui, sans-serif';
  });
  readonly fontCuerpo = computed(() => {
    const f = this.#configuracionVisual()?.tipografiaCuerpo;
    return f ? `${f}, sans-serif` : 'system-ui, sans-serif';
  });

  constructor() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.#configuracionVisual.set(JSON.parse(saved));
      } catch {}
    }

    effect(() => {
      const config = this.#configuracionVisual();
      if (!config) return;

      const root = document.documentElement;
      root.style.setProperty('--color-primario', config.colorPrincipal);
      root.style.setProperty('--color-secundario', config.colorSecundario || '');
      root.style.setProperty('--font-titulo', config.tipografiaTitulo || 'system-ui');
      root.style.setProperty('--font-cuerpo', config.tipografiaCuerpo || 'system-ui');
    });
  }

  cargar(restauranteId: number): void { 
    if (this.#cargado || this.#cargando()) return;

    this.#cargando.set(true);
    this.#error.set(null);
    this.service.obtener(restauranteId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => { 
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        this.#configuracionVisual.set(data);
        this.#cargando.set(false);
        this.#cargado = true;
      },
      error: (err) => {
        this.#cargando.set(false);
        console.error("Error en configuracion visual: ", err);
      }
    });
  }
}
