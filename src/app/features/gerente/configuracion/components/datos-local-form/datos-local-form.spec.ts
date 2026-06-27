import { TestBed } from '@angular/core/testing';
import { DatosLocalForm } from './datos-local-form';
import { vi } from 'vitest';

describe('DatosLocalForm', () => {
  const mockDatosLocal = {
    id: 1,
    nombre: 'Mi Restó',
    direccion: 'Calle 123',
    imagen: 'https://ejemplo.com/logo.png',
    colorPrincipal: '#c0392b',
    colorSecundario: '#f39c12',
    familiaTipograficaId: 2,
  };

  async function setup(datosLocal: any, familiasTipograficas?: any[]) {
    await TestBed.configureTestingModule({
      imports: [DatosLocalForm],
    }).compileComponents();

    const fixture = TestBed.createComponent(DatosLocalForm);
    fixture.componentRef.setInput('datosLocal', datosLocal);
    if (familiasTipograficas) {
      fixture.componentRef.setInput('familiasTipograficas', familiasTipograficas);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, component: fixture.componentInstance };
  }

  it('debería crearse correctamente', async () => {
    const { component } = await setup(mockDatosLocal);
    expect(component).toBeTruthy();
  });

  describe('previewUrl effect', () => {
    it('debería setear previewUrl desde datosLocal.imagen al iniciar', async () => {
      const { component } = await setup(mockDatosLocal);
      expect(component.previewUrl()).toBe('https://ejemplo.com/logo.png');
    });

    it('debería setear previewUrl cuando imagen empieza con data:', async () => {
      const { component } = await setup({
        ...mockDatosLocal,
        imagen: 'data:image/png;base64,abc123',
      });
      expect(component.previewUrl()).toBe('data:image/png;base64,abc123');
    });

    it('debería mostrar placeholder de subida sin previewUrl', async () => {
      const { fixture } = await setup({ id: 1, nombre: 'Test', imagen: null });
      fixture.detectChanges();

      const overlay = fixture.nativeElement.querySelector('.overlay-text');
      expect(overlay).toBeTruthy();
      expect(overlay.textContent).toContain('Subir imagen');
    });

    it('debería mostrar imagen cuando previewUrl existe', async () => {
      const { fixture } = await setup(mockDatosLocal);
      const img = fixture.nativeElement.querySelector('.logo-uploader img');
      expect(img).toBeTruthy();
      expect(img.src).toContain('ejemplo.com');
    });
  });

  describe('removerImagen', () => {
    it('debería limpiar previewUrl y emitir null', async () => {
      const { component } = await setup(mockDatosLocal);
      const changeSpy = vi.fn();
      const fileSpy = vi.fn();
      component.datosLocalChange.subscribe(changeSpy);
      component.archivoCambiar.subscribe(fileSpy);

      component.removerImagen();

      expect(component.previewUrl()).toBeNull();
      expect(changeSpy).toHaveBeenCalledWith({ imagen: null });
      expect(fileSpy).toHaveBeenCalledWith(null);
    });

    it('debería renderizar botón de eliminar cuando previewUrl existe', async () => {
      const { fixture } = await setup(mockDatosLocal);
      const removeBtn = fixture.nativeElement.querySelector('.logo-uploader .btn-danger');
      expect(removeBtn).toBeTruthy();
    });
  });

  describe('emitir', () => {
    it('debería emitir DatosLocalEditables parcial', async () => {
      const { component } = await setup(mockDatosLocal);
      const spy = vi.fn();
      component.datosLocalChange.subscribe(spy);

      component.emitir('nombre', 'Nuevo Nombre');

      expect(spy).toHaveBeenCalledWith({ nombre: 'Nuevo Nombre' });
    });

    it('debería emitir null cuando el valor es string vacío', async () => {
      const { component } = await setup(mockDatosLocal);
      const spy = vi.fn();
      component.datosLocalChange.subscribe(spy);

      component.emitir('nombre', '');

      expect(spy).toHaveBeenCalledWith({ nombre: null });
    });
  });

  describe('onCambiarFuente', () => {
    it('debería emitir familiaTipograficaId', async () => {
      const { component } = await setup(mockDatosLocal);
      const spy = vi.fn();
      component.datosLocalChange.subscribe(spy);

      component.onCambiarFuente(3);

      expect(spy).toHaveBeenCalledWith({ familiaTipograficaId: 3 });
    });
  });

  describe('onFileSelected', () => {
    function createMockFile(type: string): File {
      return new File(['fake-content'], `test.${type.split('/')[1]}`, { type });
    }

    it('debería leer archivo de imagen y emitir data URL', async () => {
      const { component } = await setup({ id: 1, nombre: 'Test', imagen: null });
      const fileSpy = vi.fn();
      component.archivoCambiar.subscribe(fileSpy);

      const file = createMockFile('image/png');
      const event = { target: { files: [file] } } as unknown as Event;

      component.onFileSelected(event);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(fileSpy).toHaveBeenCalledWith(file);
      expect(component.previewUrl()).toBeTruthy();
      expect(component.previewUrl()).toContain('base64');
    });

    it('debería ignorar archivos que no son imágenes', async () => {
      const { component } = await setup({ id: 1, nombre: 'Test', imagen: null });
      const spy = vi.fn();
      component.datosLocalChange.subscribe(spy);

      const file = createMockFile('application/pdf');
      const event = { target: { files: [file] } } as unknown as Event;

      component.onFileSelected(event);

      expect(spy).not.toHaveBeenCalled();
    });

    it('debería no hacer nada cuando no se selecciona archivo', async () => {
      const { component } = await setup({ id: 1, nombre: 'Test', imagen: null });
      const spy = vi.fn();
      component.datosLocalChange.subscribe(spy);

      const event = { target: { files: [] } } as unknown as Event;
      component.onFileSelected(event);

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('template interaction', () => {
    it('debería renderizar inputs de color', async () => {
      const { fixture } = await setup(mockDatosLocal);
      const colorInputs = fixture.nativeElement.querySelectorAll('.custom-color-input');
      expect(colorInputs.length).toBe(2);
    });

    it('debería renderizar input nombre con valor correcto', async () => {
      const { fixture } = await setup(mockDatosLocal);
      const nameInput = fixture.nativeElement.querySelector('.custom-text-input');
      expect(nameInput.value).toBe('Mi Restó');
    });
  });
});
