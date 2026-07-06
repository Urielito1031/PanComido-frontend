import { Injectable } from '@angular/core';
import { driver } from 'driver.js';

@Injectable({
  providedIn: 'root'
})
export class UsuariosTourService {
  private static readonly TOUR_SEEN_KEY = 'pancomido_usuarios_tour_seen';
  private driverObj?: ReturnType<typeof driver>;

  haVistoElTutorial(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(UsuariosTourService.TOUR_SEEN_KEY) === 'true';
  }

  marcarTutorialComoVisto(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(UsuariosTourService.TOUR_SEEN_KEY, 'true');
  }

  iniciarTour(): void {
    if (typeof window === 'undefined') return;

    const todosLosPasos = [
      {
        element: '.page-title',
        popover: {
          title: 'Gestión de Personal 👥',
          description: 'Aquí puedes administrar todos los usuarios y empleados de tu restaurante, incluyendo Gerentes, Mozos y personal de Cocina.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: 'app-buscador',
        popover: {
          title: 'Buscador de Personal 🔍',
          description: 'Busca empleados de forma instantánea ingresando su nombre o correo electrónico.',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.btn-pill-filter',
        popover: {
          title: 'Filtros Rápidos ⚙️',
          description: 'Filtra la lista de personal por su rol (Gerente, Mozo, Cocina) o su estado actual (Activo, Inactivo).',
          side: 'bottom' as const,
          align: 'start' as const
        }
      },
      {
        element: '.btn-premium-secondary',
        popover: {
          title: 'Registrar Nuevo Empleado ➕',
          description: 'Registra un nuevo empleado en el sistema, definiendo sus credenciales de acceso, rol y asociando sus turnos correspondientes.',
          side: 'bottom' as const,
          align: 'end' as const
        }
      },
      {
        element: '.list-panel',
        popover: {
          title: 'Lista de Personal 📋',
          description: 'Visualiza la información básica del personal. Haz clic sobre cualquier fila para abrir su ficha de información detallada.',
          side: 'right' as const,
          align: 'start' as const
        }
      },
      {
        element: '.detail-panel',
        popover: {
          title: 'Ficha Detallada 🗂️',
          description: 'Una vez seleccionado un empleado, este panel te mostrará sus datos completos de contacto, el detalle de sus turnos laborales asignados y opciones directas de edición o baja.',
          side: 'left' as const,
          align: 'start' as const
        }
      }
    ];

    const pasosActivos = todosLosPasos.filter(paso => {
      const elemento = document.querySelector(paso.element);
      return elemento !== null && (elemento as HTMLElement).offsetWidth > 0 && (elemento as HTMLElement).offsetHeight > 0;
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
        if (popover.closeButton) {
          popover.closeButton.innerHTML = '&times;';
          popover.closeButton.style.fontSize = '20px';
          popover.closeButton.style.fontWeight = '400';
          popover.closeButton.style.lineHeight = '1';
        }

        if (popover.progress) {
          popover.progress.style.whiteSpace = 'nowrap';
          popover.progress.style.flexShrink = '0';
        }

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
