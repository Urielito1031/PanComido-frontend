import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalEliminarBodega } from './modal-eliminar-bodega';

describe('ModalEliminarBodega', () => {
  let component: ModalEliminarBodega;
  let fixture: ComponentFixture<ModalEliminarBodega>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalEliminarBodega],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEliminarBodega);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
