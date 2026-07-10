import { Injectable } from '@angular/core';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class DashboardTourService {
  private static readonly TOUR_SEEN_KEY = 'pancomido_dashboard_tour_seen';
  private driverObj?: ReturnType<typeof driver>;

  /**
   * Determina si el usuario ya vio el tutorial anteriormente.
   */
  haVistoElTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(DashboardTourService.TOUR_SEEN_KEY) === 'true';
  }

  /**
   * Marca el tutorial como visto para que no se autoejecute más.
   */
  marcarTutorialComoVisto(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(DashboardTourService.TOUR_SEEN_KEY, 'true');
  }

  /**
   * Resetea el estado del tutorial para poder volver a probarlo automáticamente.
   */
  resetearTutorial(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(DashboardTourService.TOUR_SEEN_KEY);
  }

  /**
   * Inicia el tutorial interactivo con Driver.js.
   * Filtra dinámicamente los pasos según los elementos que existan actualmente en el DOM.
   */
  iniciarTour(): void {
    if (typeof window === 'undefined') return;

    // Definición de todos los pasos posibles con sus selectores y contenidos
    const todosLosPasos = [
      {
        element: '.dashboard-header',
        popover: {
          title: '¡Bienvenido al Dashboard! 👋',
          description: 'Este es el centro de control de PanComido. Te guiaremos brevemente por las secciones principales.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.view-tabs',
        popover: {
          title: 'Vistas Rápidas de Trabajo 📊',
          description: 'Navega rápidamente entre el Resumen diario, tus Favoritos personalizados, Finanzas detalladas, desempeño de Personal (mozos) o el stock de Hoy (Operativo).',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.refresh-indicator-container',
        popover: {
          title: 'Actualización en Vivo ⚡',
          description: 'El panel se actualiza de forma automática cada vez que hay actividad en el local. Si lo deseas, puedes hacer clic aquí para recargar los datos de inmediato.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '.notifications-container',
        popover: {
          title: 'Tareas Programadas 🔔',
          description: 'Revisa las alertas de stock crítico, vencimientos y sugerencias generadas automáticamente para tu restaurante.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '.period-filter',
        popover: {
          title: 'Filtro de Periodo 📅',
          description: 'Filtra todas las métricas por 1 día, 1 semana, 1 mes, 1 año o selecciona un rango personalizado de fechas.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '.executive-summary-card',
        popover: {
          title: 'Acción Gerencial Prioritaria 🎯',
          description: 'El sistema analiza los datos del local y te sugiere la acción más importante para resolver hoy.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#widget-platos-mas-vendidos',
        popover: {
          title: 'Platos Más Vendidos 🔥',
          description: 'Monitorea el ranking de los 5 platos preferidos por tus clientes y conoce sus métricas individuales.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#widget-platos-mas-vendidos .ranking-recommendation',
        popover: {
          title: 'Lectura Rápida e Inteligente 💡',
          description: 'Accede a resúmenes y sugerencias de maridajes. Deja el cursor sobre la palabra para ver su significado.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#widget-platos-menos-vendidos',
        popover: {
          title: 'Platos Menos Vendidos 📉',
          description: 'Monitorea cuáles son las preparaciones con menor salida comercial en el periodo seleccionado.',
          side: 'top' as const,
          align: 'start' as const
        }
      },
      {
        element: '#widget-platos-menos-vendidos .low-action-btn',
        popover: {
          title: 'Análisis de Plato con IA 🤖',
          description: 'Haz clic en el botón "Analizar" de cualquier plato. La IA evaluará al instante la información de los últimos 30 días, analizando márgenes de ganancia, recetas y stock para sugerirte una estrategia comercial.',
          side: 'top' as const,
          align: 'center' as const
        }
      },
      {
        element: '.customize-layout-btn',
        popover: {
          title: 'Diseña tu Lienzo 🎨',
          description: 'En el modo Favoritos, haz clic aquí para añadir, reordenar y redimensionar los widgets según tus preferencias de visualización.',
          side: 'bottom' as const,
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
