import { computed, inject, Injectable, signal } from '@angular/core';
import { ConfiguracionVisualService } from './configuracion-visual-service';
import { ConfiguracionVisual } from '../../../../core/models/domain/configuracion-visual';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracionVisualState {
  private service = inject(ConfiguracionVisualService);

   #configuracionVisual = signal<ConfiguracionVisual | null>(null);
   #cargando = signal(false);
   #error = signal<string| null>(null);

  readonly cargando = this.#cargando.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly colorPrimario = computed(
    () => this.#configuracionVisual()?.colorPrincipal
  );
  readonly colorSecundario = computed(
    () => this.#configuracionVisual()?.colorSecundario
  );
  readonly nombreLocal = computed(
    () => this.#configuracionVisual()?.nombre
  );
  readonly logoUrl = computed(
    () => this.#configuracionVisual()?.imagen
  );
  readonly fontTitulo = computed(() => {
    const f = this.#configuracionVisual()?.tipografiaTitulo;
    return f ? `${f}, sans-serif` : 'system-ui, sans-serif';
  });
  readonly fontCuerpo = computed(() => {
    const f = this.#configuracionVisual()?.tipografiaCuerpo;
    return f ? `${f}, sans-serif` : 'system-ui, sans-serif';
  });



  cargar(restauranteId: number): void { 
    if( this.#configuracionVisual() != null) return ;

    this.#cargando.set(true);
    this.service.obtener(restauranteId).pipe(takeUntilDestroyed()).subscribe({
      next: (data) => { 
        this.#configuracionVisual.set(data);
        this.#cargando.set(false);
      },
      error:(err) => {
        this.#cargando.set(false),
        console.log("Error en configuracion visual: ", err)
        
      }
    })

  }
}
