import { TestBed } from '@angular/core/testing';

import { ConfiguracionVisualState } from './configuracion-visual-state';

describe('ConfiguracionVisualState', () => {
  let service: ConfiguracionVisualState;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfiguracionVisualState);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
