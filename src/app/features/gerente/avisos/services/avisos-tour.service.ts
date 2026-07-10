import { Injectable } from '@angular/core';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class AvisosTourService {
  private static readonly TOUR_SEEN_KEY = 'pancomido_avisos_tour_seen';
  private driverObj?: ReturnType<typeof driver>;

  /**
   * Determina si el usuario ya vio el tutorial anteriormente.
   */
  haVistoElTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(AvisosTourService.TOUR_SEEN_KEY) === 'true';
  }

  /**
   * Marca el tutorial como visto.
   */
  marcarTutorialComoVisto(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(AvisosTourService.TOUR_SEEN_KEY, 'true');
  }

  /**
   * Inicia el tutorial interactivo con Driver.js para la página de avisos.
   */
  iniciarTour(): void {
    if (typeof window === 'undefined') return;

    const todosLosPasos = [
      {
        element: '.avisos-header',
        popover: {
          title: 'Sistema de Avisos 🚨',
          description: 'Aquí se concentran todas las alertas críticas de tu restaurante: stock de insumos, vencimientos y sugerencias automáticas.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: 'app-buscador',
        popover: {
          title: 'Buscador de Alertas 🔍',
          description: 'Filtra rápidamente tus avisos escribiendo el nombre de algún ingrediente o insumo.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.avisos-resumen',
        popover: {
          title: 'Resumen Rápido 📊',
          description: 'Accede a un conteo rápido y haz clic en cualquiera de estos accesos directos para saltar directamente a la sección correspondiente.',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      {
        element: '#sugerencias-ia',
        popover: {
          title: 'Recetas Inteligentes con IA 🧠',
          description: 'Nuestra IA analiza los insumos con vencimiento muy próximo y te propone nuevas recetas y platos para aprovecharlos, reduciendo tu merma al mínimo.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '#sugerencias-ia app-boton',
        popover: {
          title: 'Generar Recetas 💡',
          description: 'Haz clic aquí para activar el motor de la IA. Evaluará al instante las alternativas de platos y te permitirá crearlos en tu carta en un clic.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#seccion-stock',
        popover: {
          title: 'Stock Crítico 📦',
          description: 'Listado de insumos que están por debajo de su stock mínimo recomendado. Puedes presionar "Pedir" para iniciar su reposición rápidamente.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#seccion-vencimientos',
        popover: {
          title: 'Control de Vencimientos 📅',
          description: 'Visualiza los lotes de insumos que vencerán en los próximos días.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '.floating-navegacion-avisos',
        popover: {
          title: 'Navegación Flotante ⚓',
          description: 'Utiliza este menú flotante para moverte rápidamente entre las distintas secciones de stock y vencimientos.',
          side: 'left' as const,
          align: 'end' as const
        }
      }
    ];

    // Filtra los pasos para dejar únicamente los elementos que están visibles en la pantalla en este momento
    const pasosActivos = todosLosPasos.filter(paso => {
      const elemento = document.querySelector(paso.element);
      return elemento !== null && (elemento as HTMLElement).offsetWidth > 0 && (elemento as HTMLElement).offsetHeight > 0;
    });

    // Configura e inicia Driver.js
    this.driverObj = driver({
      showProgress: true,
      allowClose: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Entendido',
      popoverClass: 'driverjs-theme',
      overlayColor: 'rgba(15, 23, 42, 0.75)',
      steps: pasosActivos,
      onPopoverRender: (popover, { driver }) => {
        // Restaurar el botón 'X' de la esquina superior derecha
        if (popover.closeButton) {
          popover.closeButton.innerHTML = '&times;';
          popover.closeButton.style.fontSize = '20px';
          popover.closeButton.style.fontWeight = '400';
          popover.closeButton.style.lineHeight = '1';
        }

        // Evitar que el contador de pasos se achique y se rompa en dos líneas
        if (popover.progress) {
          popover.progress.style.whiteSpace = 'nowrap';
          popover.progress.style.flexShrink = '0';
        }

        // Agregar un botón "Saltar" en el footer de navegación
        if (popover.footerButtons && !popover.footerButtons.querySelector('.tour-skip-btn')) {
          const skipBtn = document.createElement('button');
          skipBtn.type = 'button';
          skipBtn.className = 'tour-skip-btn';
          skipBtn.innerText = 'Saltar';
          skipBtn.style.background = 'transparent';
          skipBtn.style.border = 'none';
          skipBtn.style.color = '#64748b';
          skipBtn.style.fontSize = '0.82rem';
          skipBtn.style.fontWeight = '700';
          skipBtn.style.cursor = 'pointer';
          skipBtn.style.padding = '0.4rem 0.6rem';
          skipBtn.style.marginRight = '0.5rem';
          skipBtn.style.fontFamily = "'Nunito', sans-serif";
          
          skipBtn.addEventListener('click', () => {
            driver.destroy();
          });

          // Insertarlo antes del botón Anterior
          popover.footerButtons.prepend(skipBtn);
        }
      },
      onDestroyed: () => {
        this.marcarTutorialComoVisto();
      }
    });

    this.driverObj.drive();
  }
}
