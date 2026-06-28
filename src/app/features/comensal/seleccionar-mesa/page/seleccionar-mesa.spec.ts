import { TestBed } from '@angular/core/testing';
import { SeleccionarMesa } from './seleccionar-mesa';
import { Router } from '@angular/router';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { vi } from 'vitest';

describe('SeleccionarMesa', () => {
  const routerMock = {
    navigate: vi.fn(),
  };

  const configMock = {
    colorPrimario: vi.fn().mockReturnValue('#1a4a2e'),
    colorSecundario: vi.fn().mockReturnValue('#f08f1a'),
    nombreLocal: vi.fn().mockReturnValue(''),
    logoUrl: vi.fn().mockReturnValue(null),
    fontTitulo: vi.fn().mockReturnValue(''),
    fontCuerpo: vi.fn().mockReturnValue(''),
    cargar: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [SeleccionarMesa],
      providers: [
        { provide: Router, useValue: routerMock },
        { provide: ConfiguracionVisualState, useValue: configMock },
      ],
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(SeleccionarMesa);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('debería crearse correctamente', () => {
    const { component } = createFixture();
    expect(component).toBeTruthy();
  });

  it('debería mostrar 6 opciones de mesa', () => {
    const { fixture } = createFixture();
    const cards = fixture.nativeElement.querySelectorAll('.mesa-card');
    expect(cards.length).toBe(6);
    expect(cards[0].textContent).toContain('Mesa 1');
    expect(cards[5].textContent).toContain('Mesa 6');
  });

  it('debería no tener mesa seleccionada inicialmente', () => {
    const { component } = createFixture();
    expect(component.mesaSeleccionada()).toBeNull();
  });

  it('debería mostrar alerta informativa sin mesa seleccionada', () => {
    const { fixture } = createFixture();
    const alert = fixture.nativeElement.querySelector('.alert-info');
    expect(alert).toBeTruthy();
    expect(alert.textContent).toContain('Toca una mesa para seleccionarla');
  });

  it('debería actualizar señal mesaSeleccionada al clickear card', () => {
    const { fixture, component } = createFixture();
    const cards = fixture.nativeElement.querySelectorAll('.mesa-card');

    cards[2].click();
    fixture.detectChanges();

    expect(component.mesaSeleccionada()).toBe(3);
    expect(cards[2].classList.contains('seleccionada')).toBeTruthy();
  });

  it('debería ocultar alerta y mostrar botón confirmar al seleccionar mesa', () => {
    const { fixture } = createFixture();
    const cards = fixture.nativeElement.querySelectorAll('.mesa-card');

    cards[0].click();
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert-info');
    expect(alert).toBeFalsy();

    const confirmBtn = fixture.nativeElement.querySelector('app-boton-comensal');
    expect(confirmBtn).toBeTruthy();
    expect(confirmBtn.textContent).toContain('Confirmar mesa 1');
  });

  it('debería navegar a cantidad-personas con mesaId al confirmar', () => {
    const { fixture, component } = createFixture();
    const cards = fixture.nativeElement.querySelectorAll('.mesa-card');

    cards[3].click();
    fixture.detectChanges();

    component.confirmarMesa();

    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/comensal/cantidad-personas'],
      { state: { mesaId: 4 } },
    );
  });

  it('debería no navegar si no hay mesa seleccionada', () => {
    const { component } = createFixture();
    component.confirmarMesa();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('debería cambiar selección al clickear otra mesa', () => {
    const { fixture, component } = createFixture();
    const cards = fixture.nativeElement.querySelectorAll('.mesa-card');

    cards[0].click();
    fixture.detectChanges();
    expect(component.mesaSeleccionada()).toBe(1);

    cards[4].click();
    fixture.detectChanges();
    expect(component.mesaSeleccionada()).toBe(5);
    expect(cards[4].classList.contains('seleccionada')).toBeTruthy();
  });
});
