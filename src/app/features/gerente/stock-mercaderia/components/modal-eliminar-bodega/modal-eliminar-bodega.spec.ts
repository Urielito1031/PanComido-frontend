import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEliminarBodegaComponent } from './modal-eliminar-bodega';
import { Bodega } from '../../../../../core/models/domain/bodega';

describe('ModalEliminarBodega', () => {
  let component: ModalEliminarBodegaComponent;
  let fixture: ComponentFixture<ModalEliminarBodegaComponent>;

  const mockBodega: Bodega = {
    id: 1,
    nombre: 'Bodega test',
    tipoBodega: 'Materia prima',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEliminarBodegaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEliminarBodegaComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('bodega', mockBodega);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
