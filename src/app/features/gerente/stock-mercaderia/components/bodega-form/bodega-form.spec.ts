import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BodegaForm } from './bodega-form';

describe('BodegaForm', () => {
  let component: BodegaForm;
  let fixture: ComponentFixture<BodegaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BodegaForm],
    }).compileComponents();

    fixture = TestBed.createComponent(BodegaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
