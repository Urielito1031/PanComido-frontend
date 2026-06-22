import { TestBed } from '@angular/core/testing';

import { MesaComensalState } from './mesa-comensal-state';

describe('MesaComensalState', () => {
  let service: MesaComensalState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MesaComensalState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
