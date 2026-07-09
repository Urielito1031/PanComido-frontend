import { TestBed } from '@angular/core/testing';

import { MiseAndPlaceState } from './mise-and-place-state';

describe('MiseAndPlaceState', () => {
  let service: MiseAndPlaceState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiseAndPlaceState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
