import { Hono } from 'hono';
import { WorkerBindings, WORKER_CONFIG } from '../config.js';

export const searchRoute = new Hono<{ Bindings: WorkerBindings }>();

/* eslint-disable @typescript-eslint/no-explicit-any */

searchRoute.get('/api/search', async (c) => {
  const q = c.req.query('q')?.trim();

  // Validate query length
  if (!q || q.length < 1 || q.length > 100) {
    return c.text('Query parameter "q" must be between 1 and 100 characters.', 400);
  }

  const token = c.env.TMDB_READ_TOKEN;
  if (!token) {
    return c.text('Worker configuration error: TMDB_READ_TOKEN secret is not set.', 500);
  }

  const url = new URL(`${WORKER_CONFIG.tmdbApiBaseUrl}/search/multi`);
  url.searchParams.set('query', q);
  url.searchParams.set('include_adult', 'false');

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      return c.text(`TMDB search failed with status ${res.status}`, 502, {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      });
    }

    const data: any = await res.json();
    const results = (data.results || [])
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        id: item.id,
        type: item.media_type,
        title: item.title || item.name || item.original_title || item.original_name || '',
        originalTitle: item.original_title || item.original_name || '',
        releaseDate: item.release_date || item.first_air_date || null,
        posterPath: item.poster_path || null,
        rating: Number((item.vote_average || 0).toFixed(1)),
        voteCount: item.vote_count || 0,
        overview: item.overview || ''
      }));

    return c.json(
      {
        query: q,
        page: data.page || 1,
        totalResults: data.total_results || results.length,
        results
      },
      200,
      {
        'Cache-Control': `public, max-age=${WORKER_CONFIG.searchEdgeCacheSeconds}`,
        'Access-Control-Allow-Origin': '*'
      }
    );
  } catch (err) {
    return c.text(`Search request error: ${String(err)}`, 502, {
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*'
    });
  }
});
