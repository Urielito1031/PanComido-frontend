import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComandaCard } from './comanda-card';
import { Comanda } from '../../../../../core/models/domain/comanda';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ComandaCard', () => {
  let component: ComandaCard;
  let fixture: ComponentFixture<ComandaCard>;

  const mockComanda: Comanda = {
    id: 15,
    mesaId: 3,
    numeroDeMesa: 3,
    cantComensales: 4,
    estado: 'Nueva',
    horaInicio: '2026-05-30T10:15:00',
    horaFin: null,
    horaUltimoCambioEstado: null,
    tiempoEstimadoTotal: 35,
    items: [
      { id: 1, articulo: { id: 1, nombre: 'Milanesa con fritas', urlImagen: null }, cantidad: 2, entregado: false, observacionesGenerales: 'Sin lechuga', observacionesIngredientes: null },
      { id: 2, articulo: { id: 2, nombre: 'Coca-Cola', urlImagen: null }, cantidad: 2, entregado: false, observacionesGenerales: null, observacionesIngredientes: null },
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComandaCard]
    }).compileComponents();

    fixture = TestBed.createComponent(ComandaCard);
    component = fixture.componentInstance;

    
    fixture.componentRef.setInput('comanda', mockComanda);

    fixture.detectChanges();
  });

  it('debería crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar el header con color según estado', () => {
    expect(component.headerClass()).toBe('bg-danger');
  });

  it('debería mostrar "ACEPTAR COMANDA" cuando el estado es Nueva', () => {
    expect(component.textoBoton()).toBe('ACEPTAR COMANDA');
  });

  it('debería mostrar "LLAMAR MOZO" cuando el estado es diferente', () => {
    const comandaEnPrep: Comanda = { 
      ...mockComanda, 
      estado: 'EnPreparacion', 
    };

    fixture.componentRef.setInput('comanda', comandaEnPrep);
    fixture.detectChanges();

    expect(component.textoBoton()).toBe('LLAMAR MOZO');
  });

  it('debería emitir el evento accion', () => {
    let emittedId: number | undefined;

    component.accion.subscribe((id) => emittedId = id);

    component.accion.emit(mockComanda.id);

    expect(emittedId).toBe(15);
  });
});