import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Plato } from '../../../../../core/models/domain/plato';
import { ModalEliminarPlatoComponent } from './modal-eliminar-plato';

describe('ModalEliminarPlatoComponent', () => {
  let fixture: ComponentFixture<ModalEliminarPlatoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEliminarPlatoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEliminarPlatoComponent);
    fixture.componentRef.setInput('plato', { id: 1, nombre: 'Pizza' } as Plato);
  });

  it('debería mostrar el plato y emitir confirmación/cierre', () => {
    const component = fixture.componentInstance;
    const confirmSpy = vi.spyOn(component.confirm, 'emit');
    const closeSpy = vi.spyOn(component.close, 'emit');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pizza');

    component.onConfirm();
    component.onClose();

    expect(confirmSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });
});
