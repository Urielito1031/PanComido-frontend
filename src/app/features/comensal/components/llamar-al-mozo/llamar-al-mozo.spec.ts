import { TestBed } from '@angular/core/testing';
import { LlamarAlMozo } from './llamar-al-mozo';
import { ConfiguracionVisualState } from '../../services/visual/configuracion-visual-state';
import { vi } from 'vitest';

describe('LlamarAlMozo', () => {
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
    await TestBed.configureTestingModule({
      imports: [LlamarAlMozo],
      providers: [
        { provide: ConfiguracionVisualState, useValue: configMock },
      ],
    }).compileComponents();
  });

  function createFixture() {
    const fixture = TestBed.createComponent(LlamarAlMozo);
    fixture.componentRef.setInput('mesaId', 5);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('debería crearse correctamente', () => {
    const { component } = createFixture();
    expect(component).toBeTruthy();
    expect(component.mesaId()).toBe(5);
  });

  describe('initial state', () => {
    it('debería tener categorías cargadas', () => {
      const { component } = createFixture();
      expect(component.categorias.length).toBe(6);
      expect(component.categorias[0].nombre).toBe('HIELO');
      expect(component.categorias[6]).toBeUndefined();
    });

    it('debería iniciar sin categoría seleccionada', () => {
      const { component } = createFixture();
      expect(component.categoriaSeleccionada()).toBeNull();
      expect(component.descripcion()).toBe('');
      expect(component.modalAbierto()).toBe(false);
    });
  });

  describe('categoria selection', () => {
    it('debería seleccionar categoría al llamar seleccionarCategoria', () => {
      const { component } = createFixture();
      component.seleccionarCategoria(3);
      expect(component.categoriaSeleccionada()).toBe(3);
    });

    it('debería cambiar selección de categoría', () => {
      const { component } = createFixture();
      component.seleccionarCategoria(1);
      expect(component.categoriaSeleccionada()).toBe(1);
      component.seleccionarCategoria(5);
      expect(component.categoriaSeleccionada()).toBe(5);
    });
  });

  describe('modal', () => {
    it('debería resetear estado al abrir modal', () => {
      const { component } = createFixture();
      component.seleccionarCategoria(2);
      component.descripcion.set('Algo');

      component.abrirModal();

      expect(component.categoriaSeleccionada()).toBeNull();
      expect(component.descripcion()).toBe('');
      expect(component.modalAbierto()).toBe(true);
    });

    it('debería cerrar modal y emitir modalCerrado', () => {
      const { component } = createFixture();
      const spy = vi.fn();
      component.modalCerrado.subscribe(spy);

      component.abrirModal();
      component.cerrarModal();

      expect(component.modalAbierto()).toBe(false);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('enviar', () => {
    it('debería emitir llamadoMozo con datos correctos cuando hay categoría', () => {
      const { component } = createFixture();
      const spy = vi.fn();
      component.llamadoMozo.subscribe(spy);

      component.seleccionarCategoria(2);
      component.descripcion.set('Por favor, venga');
      component.enviar();

      expect(spy).toHaveBeenCalledWith({
        mesaId: 5,
        categoriaLlamadoId: 2,
        descripcion: 'Por favor, venga',
      });
    });

    it('debería no emitir si no hay categoría seleccionada', () => {
      const { component } = createFixture();
      const spy = vi.fn();
      component.llamadoMozo.subscribe(spy);

      component.enviar();

      expect(spy).not.toHaveBeenCalled();
    });

    it('debería no emitir si enviando es true', () => {
      const { fixture, component } = createFixture();
      const spy = vi.fn();
      component.llamadoMozo.subscribe(spy);

      fixture.componentRef.setInput('enviando', true);
      fixture.detectChanges();

      component.seleccionarCategoria(1);
      component.enviar();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('aceptar', () => {
    it('debería cerrar modal al llamar aceptar', () => {
      const { component } = createFixture();
      component.abrirModal();
      component.aceptar();
      expect(component.modalAbierto()).toBe(false);
    });
  });

  describe('template rendering', () => {
    it('debería renderizar el botón de mozo', () => {
      const { fixture } = createFixture();
      const btn = fixture.nativeElement.querySelector('.waiter-btn');
      expect(btn).toBeTruthy();
      expect(btn.textContent).toContain('Mozo');
    });

    it('debería mostrar el diálogo cuando el modal está abierto', () => {
      const { fixture } = createFixture();
      const btn = fixture.nativeElement.querySelector('.waiter-btn');
      btn.click();
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector('#modal-llamar-mozo');
      expect(dialog).toBeTruthy();
    });

    it('debería mostrar mensaje de éxito cuando enviado es true', () => {
      const { fixture } = createFixture();
      const btn = fixture.nativeElement.querySelector('.waiter-btn');
      btn.click();
      fixture.detectChanges();

      fixture.componentRef.setInput('enviado', true);
      fixture.detectChanges();

      const successMsg = fixture.nativeElement.querySelector('.mensaje-exito');
      expect(successMsg).toBeTruthy();
      expect(successMsg.textContent).toContain('Tu llamado al mozo fue enviado');
    });

    it('debería mostrar mensaje de error cuando se setea input error', () => {
      const { fixture } = createFixture();
      const btn = fixture.nativeElement.querySelector('.waiter-btn');
      btn.click();
      fixture.detectChanges();

      fixture.componentRef.setInput('error', 'Error de conexión');
      fixture.detectChanges();

      const errorEl = fixture.nativeElement.querySelector('.alert-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl.textContent).toContain('Error de conexión');
    });

    it('debería deshabilitar botón llamar sin categoría seleccionada', () => {
      const { fixture } = createFixture();
      const btn = fixture.nativeElement.querySelector('.waiter-btn');
      btn.click();
      fixture.detectChanges();

      const llamarBtn = fixture.nativeElement.querySelector('.btn-llamar');
      expect(llamarBtn.disabled).toBe(true);
    });

    it('debería habilitar botón llamar con categoría seleccionada', () => {
      const { fixture, component } = createFixture();
      const btn = fixture.nativeElement.querySelector('.waiter-btn');
      btn.click();
      fixture.detectChanges();

      component.seleccionarCategoria(1);
      fixture.detectChanges();

      const llamarBtn = fixture.nativeElement.querySelector('.btn-llamar');
      expect(llamarBtn.disabled).toBe(false);
    });
  });
});
