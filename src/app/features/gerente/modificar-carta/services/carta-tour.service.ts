import { Injectable } from '@angular/core';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class CartaTourService {
  private static readonly TOUR_SEEN_KEY = 'pancomido_carta_tour_seen';
  private driverObj?: ReturnType<typeof driver>;

  /**
   * Determina si el usuario ya vio el tutorial anteriormente.
   */
  haVistoElTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(CartaTourService.TOUR_SEEN_KEY) === 'true';
  }

  /**
   * Marca el tutorial como visto.
   */
  marcarTutorialComoVisto(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CartaTourService.TOUR_SEEN_KEY, 'true');
  }

  /**
   * Inicia el tutorial interactivo con Driver.js para la página de modificar carta.
   */
  iniciarTour(): void {
    if (typeof window === 'undefined') return;

    const todosLosPasos = [
      {
        element: '.carta-header',
        popover: {
          title: 'Gestión de Carta 📋',
          description: 'Este es el catálogo de tu local. Aquí puedes editar, ocultar, fijar y organizar todo tu menú de comida y bebida.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: 'app-buscador',
        popover: {
          title: 'Buscar Producto 🔍',
          description: 'Busca al instante cualquier plato o bebida de tu carta simplemente escribiendo su nombre.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.btn-sort-trigger',
        popover: {
          title: 'Ordenamiento Inteligente ↕️',
          description: 'Ordena la carta según relevancia, precio, o utiliza las métricas de más o menos vendidos para identificar prioridades.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.segmented-control',
        popover: {
          title: 'Modos de Vista 🖥️',
          description: 'Intercambia entre la vista en Cuadrícula (ideal para ver imágenes) y la vista en Lista compacta (ideal para ediciones masivas rápidas).',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      {
        element: '.btn-premium-primary',
        popover: {
          title: 'Agregar a la Carta ➕',
          description: 'Crea nuevos platos o bebidas. Define sus ingredientes, tiempo de preparación, visibilidad y categoría en pocos pasos.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '#seccion-recomendados',
        popover: {
          title: 'Destacados y Recomendados ⭐',
          description: 'Estos platos aparecen resaltados en la carta del cliente. Son ideales para promocionar tus platos estrella o los maridajes sugeridos.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#seccion-platos',
        popover: {
          title: 'Sección de Comidas 🍔',
          description: 'Administra tus categorías de comida y utiliza los filtros superiores para navegar entre los subtipos de platos.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#seccion-bebidas',
        popover: {
          title: 'Sección de Bebidas 🍹',
          description: 'Gestiona la oferta de refrescos, jugos, tragos y vinos de tu restaurante.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '.floating-navegacion-carta',
        popover: {
          title: 'Menú Rápido de Navegación ⚓',
          description: 'Despliega este menú flotante para saltar directamente a cualquiera de las secciones principales de la carta sin tener que hacer scroll.',
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
