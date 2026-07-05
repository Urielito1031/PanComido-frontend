import { Injectable } from '@angular/core';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class StockTourService {
  private static readonly TOUR_SEEN_KEY = 'pancomido_stock_tour_seen';
  private driverObj?: ReturnType<typeof driver>;

  /**
   * Determina si el usuario ya vio el tutorial anteriormente.
   */
  haVistoElTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(StockTourService.TOUR_SEEN_KEY) === 'true';
  }

  /**
   * Marca el tutorial como visto.
   */
  marcarTutorialComoVisto(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(StockTourService.TOUR_SEEN_KEY, 'true');
  }

  /**
   * Inicia el tutorial interactivo con Driver.js para la página de Stock de Mercadería.
   */
  iniciarTour(): void {
    if (typeof window === 'undefined') return;

    const todosLosPasos = [
      {
        element: '.stock-header',
        popover: {
          title: 'Stock de Mercadería 📦',
          description: 'Acá podés controlar todo el inventario de tu restaurante: niveles de stock por producto, depósitos (bodegas) y lotes con fechas de vencimiento.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: 'app-buscador',
        popover: {
          title: 'Buscador de Insumos 🔍',
          description: 'Escribí el nombre de cualquier ingrediente o insumo para encontrarlo rápidamente dentro del inventario.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.btn-premium-primary',
        popover: {
          title: 'Registrar Nuevo Insumo ➕',
          description: 'Agregá un nuevo ingrediente al inventario, definiendo su nombre, categoría, unidad de medida, stock actual y stock mínimo.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '.stock-metrics-strip',
        popover: {
          title: 'Indicadores de Stock 🚦',
          description: 'Un resumen visual del estado de tu inventario. Hacé clic en cualquier tarjeta para filtrar: <strong>Críticos</strong> (por debajo del mínimo), <strong>Bajos</strong> (cerca del límite) o <strong>Ok</strong> (con stock suficiente).',
          side: 'bottom' as const,
          align: 'center' as const
        }
      },
      {
        element: '.stock-executive-summary',
        popover: {
          title: 'Alerta de Inventario ⚠️',
          description: 'Cuando hay productos críticos o bajos, este banner te avisa de forma inmediata con un resumen de la situación para que puedas actuar a tiempo.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.categoria-pills-container',
        popover: {
          title: 'Filtro por Categorías 🏷️',
          description: 'Filtrá tu inventario por categoría de insumos (lácteos, carnes, verduras, etc.). Las pastillas con puntos de color indican si esa categoría tiene algún producto en estado crítico o bajo.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.stock-tabs',
        popover: {
          title: 'Vistas del Inventario 📂',
          description: 'Cambiá entre tres vistas: <strong>Productos</strong> (todo el inventario general), <strong>Bodegas</strong> (stock por depósito) y <strong>Lotes</strong> (control de vencimientos por lote).',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.stock-panel',
        popover: {
          title: 'Listado de Insumos 📋',
          description: 'Acá se muestran los productos según la vista y los filtros activos. Podés editar cualquier insumo haciendo clic en el ícono de edición en cada fila.',
          side: 'top' as const,
          align: 'start' as const
        }
      }
    ];

    // Filtra los pasos para mostrar solo elementos visibles en pantalla
    const pasosActivos = todosLosPasos.filter(paso => {
      const elemento = document.querySelector(paso.element);
      return elemento !== null &&
        (elemento as HTMLElement).offsetWidth > 0 &&
        (elemento as HTMLElement).offsetHeight > 0;
    });

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
        // Restaurar botón X de cierre
        if (popover.closeButton) {
          popover.closeButton.innerHTML = '&times;';
          popover.closeButton.style.fontSize = '20px';
          popover.closeButton.style.fontWeight = '400';
          popover.closeButton.style.lineHeight = '1';
        }

        // Evitar que el contador de pasos se rompa en dos líneas
        if (popover.progress) {
          popover.progress.style.whiteSpace = 'nowrap';
          popover.progress.style.flexShrink = '0';
        }

        // Botón "Saltar" en el footer
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
