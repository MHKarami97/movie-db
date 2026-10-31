import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('Worker Edge Cache Headers', () => {
  const dummyEnv = {
    TMDB_READ_TOKEN: 'test-token',
    ALLOWED_ORIGIN: '*'
  };

  const dummyCtx = {
    waitUntil: () => {},
    passThroughOnException: () => {}
  } as any;

  it('rejects invalid title fetch when token fails', async () => {
    const req = new Request('http://localhost/api/title/movie/550');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    // Without live TMDB network in tests, fetch fails and returns 502 with no-store
    expect(res.status).toBe(502);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });
});
