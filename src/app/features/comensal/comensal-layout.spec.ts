import { TestBed } from '@angular/core/testing';
import { ComensalLayout } from './comensal-layout';
import { ConfiguracionVisualState } from './services/visual/configuracion-visual-state';
import { vi } from 'vitest';

describe('ComensalLayout', () => {
  const configMock = {
    cargar: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComensalLayout],
      providers: [
        { provide: ConfiguracionVisualState, useValue: configMock },
      ],
    }).compileComponents();
  });

  it('debería crearse correctamente', () => {
    const fixture = TestBed.createComponent(ComensalLayout);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debería llamar cargar con restauranteId del history.state', () => {
    vi.spyOn(history, 'state', 'get').mockReturnValue({ restauranteId: 5 });
    const fixture = TestBed.createComponent(ComensalLayout);
    fixture.detectChanges();

    expect(configMock.cargar).toHaveBeenCalledWith(5);
  });

  it('debería usar restauranteId=1 si history.state está vacío', () => {
    vi.spyOn(history, 'state', 'get').mockReturnValue({});
    const fixture = TestBed.createComponent(ComensalLayout);
    fixture.detectChanges();

    expect(configMock.cargar).toHaveBeenCalledWith(1);
  });
});
