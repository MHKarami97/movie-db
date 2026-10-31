import { Hono } from 'hono';
import { WorkerBindings, WORKER_CONFIG } from '../config.js';
import { WorkerNormalizer } from '../normalizer.js';

export const titleRoute = new Hono<{ Bindings: WorkerBindings }>();

interface TitleCacheRow {
  data: string;
  fetched_at: number;
}

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

  const nowMs = Date.now();
  const freshnessThresholdMs = WORKER_CONFIG.d1FreshnessDays * 86400 * 1000;
  const maxStaleThresholdMs = WORKER_CONFIG.d1StaleMaxDays * 86400 * 1000;

  // 1. Check D1 cache
  let cachedRow: TitleCacheRow | null = null;
  try {
    const stmt = c.env.DB.prepare(
      'SELECT data, fetched_at FROM title_cache WHERE type = ? AND id = ?'
    ).bind(type, id);
    cachedRow = (await stmt.first()) as TitleCacheRow | null;
  } catch (dbErr) {
    console.warn('[worker] D1 cache query error:', dbErr);
  }

  // 2. If present and fresh (< 30 days old), return immediately
  if (cachedRow && nowMs - cachedRow.fetched_at < freshnessThresholdMs) {
    try {
      const data = JSON.parse(cachedRow.data);
      return c.json(data, 200, {
        'Cache-Control': 'public, max-age=86400',
        'X-Cache-Status': 'HIT'
      });
    } catch {
      // Corrupt data in DB, proceed to re-fetch
    }
  }

  // 3. Fetch from TMDB
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
    const res = await fetch(`${endpoint}?append_to_response=${appends}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 404) {
      return c.text('Title not found on TMDB.', 404);
    }

    if (!res.ok) {
      throw new Error(`TMDB error HTTP ${res.status}`);
    }

    const rawData = await res.json();
    const normalized =
      type === 'movie'
        ? WorkerNormalizer.normalizeMovie(rawData, nowMs)
        : WorkerNormalizer.normalizeTv(rawData, nowMs);

    const serialized = JSON.stringify(normalized);

    // Upsert into D1 cache and record in known_ids
    c.executionCtx.waitUntil(
      (async () => {
        try {
          await c.env.DB.batch([
            c.env.DB.prepare(`
              INSERT INTO title_cache (type, id, data, fetched_at, updated_at)
              VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(type, id) DO UPDATE SET
                data = excluded.data,
                fetched_at = excluded.fetched_at,
                updated_at = excluded.updated_at
            `).bind(type, id, serialized, nowMs, nowMs),
            c.env.DB.prepare(`
              INSERT OR IGNORE INTO known_ids (type, id, recorded_at)
              VALUES (?, ?, ?)
            `).bind(type, id, nowMs)
          ]);
        } catch (saveErr) {
          console.warn('[worker] D1 upsert error:', saveErr);
        }
      })()
    );

    return c.json(normalized, 200, {
      'Cache-Control': 'public, max-age=86400',
      'X-Cache-Status': 'MISS'
    });
  } catch (fetchErr) {
    // 4. Stale fallback: if row is younger than 90 days, return stale
    if (cachedRow && nowMs - cachedRow.fetched_at < maxStaleThresholdMs) {
      try {
        const staleData = JSON.parse(cachedRow.data);
        return c.json(staleData, 200, {
          'Cache-Control': 'public, max-age=3600',
          'X-Cache-Status': 'STALE',
          'X-Cache-Warning': 'TMDB fetch failed; served stale metadata (<90 days old).'
        });
      } catch {
        // Fall through to error
      }
    }

    return c.text(`Failed to fetch title from TMDB: ${String(fetchErr)}`, 502);
  }
});
