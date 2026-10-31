import { describe, it, expect } from 'vitest';
import worker from '../src/index.js';

describe('Worker Routes & Validation (Zero-D1)', () => {
  const dummyEnv = {
    TMDB_READ_TOKEN: 'secret-auth-token',
    ALLOWED_ORIGIN: '*'
  };

  const dummyCtx = {
    waitUntil: () => {},
    passThroughOnException: () => {}
  } as any;

  it('rejects disallowed image sizes with 400', async () => {
    const req = new Request('http://localhost/img/w99999/poster.jpg');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Invalid image size');
  });

  it('rejects invalid image paths with 400', async () => {
    const req = new Request('http://localhost/img/w500/not-an-image.txt');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Invalid image path format');
  });

  it('rejects invalid title types with 400', async () => {
    const req = new Request('http://localhost/api/title/podcast/123');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain("Invalid media type. Must be 'movie' or 'tv'");
  });

  it('rejects non-numeric title IDs with 400', async () => {
    const req = new Request('http://localhost/api/title/movie/abc');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Invalid title ID');
  });

  it('rejects empty search queries with 400', async () => {
    const req = new Request('http://localhost/api/search?q=');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain('Query parameter "q" must be between 1 and 100 characters');
  });

  it('returns health check status with zero-d1-cache mode', async () => {
    const req = new Request('http://localhost/health');
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.status).toBe('ok');
    expect(data.mode).toBe('zero-d1-cache');
  });

  it('handles image preflight OPTIONS request with CORS and CORP headers', async () => {
    const req = new Request('http://localhost/img/w185/test.jpg', { method: 'OPTIONS' });
    const res = await worker.fetch(req, dummyEnv, dummyCtx);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Cross-Origin-Resource-Policy')).toBe('cross-origin');
  });
});
