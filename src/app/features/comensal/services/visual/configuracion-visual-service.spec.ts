import { TestBed } from '@angular/core/testing';

import { ConfiguracionVisualService } from './configuracion-visual-service';

describe('ConfiguracionVisualService', () => {
  let service: ConfiguracionVisualService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfiguracionVisualService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
