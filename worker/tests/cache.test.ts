import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('Worker Title Cache Logic', () => {
  it('serves cached title when fresh in D1 database', async () => {
    const cachedData = {
      id: 550,
      type: 'movie',
      title: 'Fight Club',
      rating: 8.4
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              data: JSON.stringify(cachedData),
              fetched_at: Date.now() - 5 * 86400 * 1000 // 5 days old (fresh <30 days)
            }),
            run: async () => ({ meta: { changes: 0 } })
          })
        }),
        batch: async () => []
      } as any,
      TMDB_READ_TOKEN: 'test-token',
      ALLOWED_ORIGIN: '*'
    };

    const dummyCtx = { waitUntil: () => {} } as any;

    const req = new Request('http://localhost/api/title/movie/550');
    const res = await worker.fetch(req, mockEnv, dummyCtx);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache-Status')).toBe('HIT');
    const data = await res.json();
    expect(data.title).toBe('Fight Club');
  });

  it('serves stale data if TMDB fails and cache is younger than 90 days', async () => {
    const cachedData = {
      id: 550,
      type: 'movie',
      title: 'Fight Club',
      rating: 8.4
    };

    const mockEnv = {
      DB: {
        prepare: () => ({
          bind: () => ({
            first: async () => ({
              data: JSON.stringify(cachedData),
              fetched_at: Date.now() - 40 * 86400 * 1000 // 40 days old (>30 days so re-fetch, but <90 days)
            }),
            run: async () => ({ meta: { changes: 0 } })
          })
        }),
        batch: async () => []
      } as any,
      TMDB_READ_TOKEN: 'invalid-failing-token',
      ALLOWED_ORIGIN: '*'
    };

    const dummyCtx = { waitUntil: () => {} } as any;

    // fetch will fail on invalid token
    const req = new Request('http://localhost/api/title/movie/550');
    const res = await worker.fetch(req, mockEnv, dummyCtx);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-Cache-Status')).toBe('STALE');
    const data = await res.json();
    expect(data.title).toBe('Fight Club');
  });
});
