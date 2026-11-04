import { Hono } from 'hono';
import { WorkerBindings, WORKER_CONFIG } from '../config.js';
import { WorkerNormalizer } from '../normalizer.js';

export const titleRoute = new Hono<{ Bindings: WorkerBindings }>();

titleRoute.get('/api/title/:type/:id', async (c) => {
  const type = c.req.param('type');
  const idStr = c.req.param('id');
  const id = parseInt(idStr, 10);

  if (type !== 'movie' && type !== 'tv') {
    return c.text("Invalid media type. Must be 'movie' or 'tv'.", 400);
  }

  if (isNaN(id) || id <= 0) {
    return c.text('Invalid title ID. Must be a positive integer.', 400);
  }

  // Fetch from TMDB (edge caching is handled by Workers Cache via Cache-Control) for out-of-window title
  const token = c.env.TMDB_READ_TOKEN;
  if (!token) {
    return c.text('Worker configuration error: TMDB_READ_TOKEN secret is not set.', 500);
  }

  const endpoint = `${WORKER_CONFIG.tmdbApiBaseUrl}/${type}/${id}`;
  const appends =
    type === 'movie'
      ? 'videos,credits,release_dates,watch/providers,external_ids,translations'
      : 'videos,credits,watch/providers,external_ids,translations';

  try {
    const res = await fetch(`${endpoint}?language=en-US&append_to_response=${appends}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 404) {
      const notFoundHeaders = new Headers();
      notFoundHeaders.set('Access-Control-Allow-Origin', '*');
      notFoundHeaders.set('Cache-Control', `public, max-age=${WORKER_CONFIG.title404CacheMaxAgeSeconds}`);
      const notFoundRes = new Response('Title not found on TMDB.', {
        status: 404,
        headers: notFoundHeaders
      });
      return notFoundRes;
    }

    if (!res.ok) {
      return new Response(`TMDB error HTTP ${res.status}`, {
        status: 502,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    const rawData = await res.json();
    const normalized =
      type === 'movie'
        ? WorkerNormalizer.normalizeMovie(rawData, Date.now())
        : WorkerNormalizer.normalizeTv(rawData, Date.now());

    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', `public, max-age=${WORKER_CONFIG.titleCacheMaxAgeSeconds}`);

    const finalResponse = new Response(JSON.stringify(normalized), {
      status: 200,
      headers
    });

    return finalResponse;
  } catch (err) {
    return new Response(`Failed to fetch title from TMDB: ${String(err)}`, {
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }
});
