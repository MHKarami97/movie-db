import { describe, it, expect } from 'vitest';
import { RefreshScheduler } from '../src/services/RefreshScheduler.js';
import { KnownId, TitleDetail } from '../src/types.js';

describe('RefreshScheduler', () => {
  it('correctly schedules new items, refreshes oldest items exceeding 90 days, and prunes items exceeding 150 days', () => {
    const scheduler = new RefreshScheduler(90, 150, 2);
    const nowMs = 1700000000000;
    const dayMs = 86400 * 1000;

    const discoveredInWindow: KnownId[] = [
      { type: 'movie', id: 1 }, // in window, exists and fresh
      { type: 'movie', id: 2 }, // in window, exists and old (100 days)
      { type: 'movie', id: 3 }, // in window, exists and very old (120 days)
      { type: 'movie', id: 4 }, // in window, exists and old (95 days)
      { type: 'movie', id: 5 }  // in window, brand new (not on disk)
    ];

    const existingRecords: TitleDetail[] = [
      { id: 1, type: 'movie', fetchedAt: nowMs - 10 * dayMs } as TitleDetail,
      { id: 2, type: 'movie', fetchedAt: nowMs - 100 * dayMs } as TitleDetail,
      { id: 3, type: 'movie', fetchedAt: nowMs - 120 * dayMs } as TitleDetail,
      { id: 4, type: 'movie', fetchedAt: nowMs - 95 * dayMs } as TitleDetail,
      // Out of window items:
      { id: 6, type: 'movie', fetchedAt: nowMs - 100 * dayMs } as TitleDetail, // out of window, but <150 days -> keep
      { id: 7, type: 'movie', fetchedAt: nowMs - 160 * dayMs } as TitleDetail  // out of window, >150 days -> prune!
    ];

    const decision = scheduler.plan(discoveredInWindow, existingRecords, nowMs);

    // 1. toFetchNew: only id 5
    expect(decision.toFetchNew).toEqual([{ type: 'movie', id: 5 }]);

    // 2. toRefreshOldest: candidates were id 3 (120d), id 2 (100d), id 4 (95d). Budget = 2!
    // So top 2 oldest: id 3 and id 2
    expect(decision.toRefreshOldest).toEqual([
      { type: 'movie', id: 3 },
      { type: 'movie', id: 2 }
    ]);

    // 3. toPruneFromDisk: id 7 (>150 days out of window)
    expect(decision.toPruneFromDisk).toEqual([{ type: 'movie', id: 7 }]);
  });
});
