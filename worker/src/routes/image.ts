import { Hono } from 'hono';
import { ALLOWED_IMAGE_SIZES, WORKER_CONFIG } from '../config.js';

export const imageRoute = new Hono();

const PATH_REGEX = /^\/[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp|svg)$/i;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Cross-Origin-Resource-Policy': 'cross-origin'
};

imageRoute.options('/img/:size/*', () => {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match, Range',
      'Access-Control-Max-Age': '86400'
    }
  });
});

imageRoute.get('/img/:size/*', async (c) => {
  const size = c.req.param('size');
  const rawPath = c.req.path.replace(`/img/${size}`, '');
  const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  if (!ALLOWED_IMAGE_SIZES.has(size)) {
    return c.text(`Invalid image size: '${size}'. Allowed: ${Array.from(ALLOWED_IMAGE_SIZES).join(', ')}`, 400);
  }

  if (!PATH_REGEX.test(cleanPath)) {
    return c.text(`Invalid image path format: '${cleanPath}'`, 400);
  }

  const tmdbRes = await fetch(`${WORKER_CONFIG.tmdbImageBaseUrl}/${size}${cleanPath}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'Cloudflare-Worker-TMDB-Image-Proxy',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });

  if (tmdbRes.status === 200) {
    const headers = new Headers(CORS_HEADERS);
    headers.set('Cache-Control', `public, max-age=${WORKER_CONFIG.imageCacheMaxAgeSeconds}, immutable`);

    const contentType = tmdbRes.headers.get('content-type');
    if (contentType) headers.set('Content-Type', contentType);

    const etag = tmdbRes.headers.get('etag');
    if (etag) headers.set('ETag', etag);

    return new Response(tmdbRes.body, { status: 200, headers });
  }

  if (tmdbRes.status === 404) {
    const headers = new Headers(CORS_HEADERS);
    headers.set('Cache-Control', `public, max-age=${WORKER_CONFIG.image404CacheMaxAgeSeconds}`);
    return new Response('Image not found on TMDB', { status: 404, headers });
  }

  const headers = new Headers(CORS_HEADERS);
  headers.set('Cache-Control', 'no-store');
  headers.set('Retry-After', tmdbRes.headers.get('retry-after') ?? '2');
  return new Response(tmdbRes.body, {
    status: tmdbRes.status === 429 ? 503 : 502,
    headers
  });
});
