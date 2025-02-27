import { TestBed } from '@angular/core/testing';

import { BeaconServiceService } from './beacon-service.service';

describe('BeaconServiceService', () => {
  let service: BeaconServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BeaconServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
