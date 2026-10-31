import { describe, it, expect } from 'vitest';
import { DiscoverService } from '../src/services/DiscoverService.js';
import { ITmdbClient } from '../src/client/TmdbClient.js';

describe('Window Logic and Date Slicing', () => {
  const dummyClient: ITmdbClient = {
    get: async () => ({ page: 1, results: [], total_pages: 1, total_results: 0 })
  };

  it('generates contiguous monthly slices covering the exact window', () => {
    const service = new DiscoverService(dummyClient);
    const start = new Date(2025, 0, 15); // Jan 15, 2025
    const end = new Date(2025, 2, 20); // Mar 20, 2025

    const slices = service.generateMonthlySlices(start, end);

    expect(slices.length).toBe(3);
    expect(slices[0]).toEqual({ startDate: '2025-01-01', endDate: '2025-01-31' });
    expect(slices[1]).toEqual({ startDate: '2025-02-01', endDate: '2025-02-28' });
    expect(slices[2]).toEqual({ startDate: '2025-03-01', endDate: '2025-03-31' });
  });
});
