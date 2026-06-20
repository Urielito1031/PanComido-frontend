import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { MisComandasPage } from './mis-comandas-page';
import { MozoComandaState } from '../../services/mozo-comanda-state';

describe('MisComandasPage', () => {
  let component: MisComandasPage;
  let fixture: ComponentFixture<MisComandasPage>;
  let mockState: any;

  beforeEach(async () => {
    mockState = {
      comandas: signal([]),
      cargando: signal(false),
      comandasNuevas: signal([]),
      comandasEnPreparacion: signal([]),
      comandasEnEspera: signal([]),
      cargarComandas: vi.fn(),
      conectarHub: vi.fn().mockResolvedValue(true),
      desconectarHub: vi.fn(),
      entregarItems: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [MisComandasPage],
      providers: [
        { provide: MozoComandaState, useValue: mockState }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MisComandasPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
