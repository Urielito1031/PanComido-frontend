import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiseAndPlaceCard } from './mise-and-place-card';

describe('MiseAndPlaceCard', () => {
  let component: MiseAndPlaceCard;
  let fixture: ComponentFixture<MiseAndPlaceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiseAndPlaceCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MiseAndPlaceCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
