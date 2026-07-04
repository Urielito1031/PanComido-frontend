import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstrellasRating } from './estrellas-rating';

describe('EstrellasRating', () => {
  let component: EstrellasRating;
  let fixture: ComponentFixture<EstrellasRating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstrellasRating],
    }).compileComponents();

    fixture = TestBed.createComponent(EstrellasRating);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
