import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiseAndPlaceForm } from './mise-and-place-form';

describe('MiseAndPlaceForm', () => {
  let component: MiseAndPlaceForm;
  let fixture: ComponentFixture<MiseAndPlaceForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiseAndPlaceForm],
    }).compileComponents();

    fixture = TestBed.createComponent(MiseAndPlaceForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('categorias', []);
    fixture.componentRef.setInput('unidadesMedida', []);
    fixture.componentRef.setInput('ingredientes', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
