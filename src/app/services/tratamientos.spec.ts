import { TestBed } from '@angular/core/testing';

import { Tratamientos } from './tratamientos';

describe('Tratamientos', () => {
  let service: Tratamientos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Tratamientos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
