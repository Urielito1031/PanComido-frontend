import { TestBed } from '@angular/core/testing';

import { MiseAndPlaceService } from './mise-and-place-service';

describe('MiseAndPlaceService', () => {
  let service: MiseAndPlaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MiseAndPlaceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
