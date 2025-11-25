import { TestBed } from '@angular/core/testing';

import { StatsService } from './stats.service';

describe('Stats', () => {
  let service: StatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});