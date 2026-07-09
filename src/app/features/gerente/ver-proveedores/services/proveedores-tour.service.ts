import { Injectable } from '@angular/core';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresTourService {
  private static readonly TOUR_SEEN_KEY = 'pancomido_proveedores_tour_seen';
  private driverObj?: ReturnType<typeof driver>;

  /**
   * Determina si el usuario ya vio el tutorial anteriormente.
   */
  haVistoElTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(ProveedoresTourService.TOUR_SEEN_KEY) === 'true';
  }

  /**
   * Marca el tutorial como visto.
   */
  marcarTutorialComoVisto(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ProveedoresTourService.TOUR_SEEN_KEY, 'true');
  }

  /**
   * Inicia el tutorial interactivo con Driver.js para la página de proveedores.
   */
  iniciarTour(): void {
    if (typeof window === 'undefined') return;

    const todosLosPasos = [
      {
        element: '.page-title',
        popover: {
          title: 'Gestión de Proveedores 🤝',
          description: 'Aquí puedes administrar todos los proveedores asociados a tu restaurante, gestionar sus pedidos de reabastecimiento y revisar el historial de transacciones.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: 'app-buscador',
        popover: {
          title: 'Buscador de Proveedores 🔍',
          description: 'Encuentra rápidamente un proveedor escribiendo su nombre o las categorías asociadas.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.btn-premium-primary',
        popover: {
          title: 'Pedido Sugerido 📋',
          description: 'Accede a la herramienta de Pedido Sugerido. El sistema calcula automáticamente qué comprar basándose en tu stock actual, mermas registradas y estimación de consumo.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '.btn-premium-secondary',
        popover: {
          title: 'Registrar Proveedor ➕',
          description: 'Registra un proveedor nuevo en el sistema, definiendo su nombre, número de WhatsApp y las categorías de insumos que comercializa.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '.list-panel',
        popover: {
          title: 'Lista de Proveedores 📋',
          description: 'Explora y selecciona tus proveedores. Desde aquí tienes accesos rápidos para editar su información, abrir el historial de compras o iniciar un pedido.',
          side: 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '.detail-panel',
        popover: {
          title: 'Ficha de Información Detallada 🗂️',
          description: 'Al seleccionar un proveedor, este panel derecho te muestra su información de contacto, datos estadísticos (último pedido, total de pedidos) y herramientas de gestión.',
          side: 'left' as const,
          align: 'start' as const
        }
      },
      {
        element: '.detail-tabs',
        popover: {
          title: 'Historial vs Nuevo Pedido 🔄',
          description: 'Intercambia pestañas para consultar el historial detallado de pedidos antiguos o armar una orden de compra para reponer stock al instante.',
          side: 'bottom' as const,
          align: 'center' as const
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
      popoverClass: 'driverjs-theme proveedores-tour-theme',
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
