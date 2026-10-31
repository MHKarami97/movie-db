import { Hono } from 'hono';
import { ALLOWED_IMAGE_SIZES, WORKER_CONFIG } from '../config.js';

export const imageRoute = new Hono();

// Strict regex for TMDB image path: must start with slash, followed by valid characters and image extension
const PATH_REGEX = /^\/[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|webp|svg)$/i;

// Preflight CORS handler for images
imageRoute.options('/img/:size/*', (c) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match, Range',
      'Access-Control-Max-Age': '86400',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    }
  });
});

imageRoute.get('/img/:size/*', async (c) => {
  const size = c.req.param('size');
  // Get remainder of wildcard path
  const rawPath = c.req.path.replace(`/img/${size}`, '');
  const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;

  // 1. Validate image size against TMDB documented allowlist
  if (!ALLOWED_IMAGE_SIZES.has(size)) {
    return c.text(`Invalid image size: '${size}'. Allowed: ${Array.from(ALLOWED_IMAGE_SIZES).join(', ')}`, 400);
  }

  // 2. Validate path against strict regex
  if (!PATH_REGEX.test(cleanPath)) {
    return c.text(`Invalid image path format: '${cleanPath}'`, 400);
  }

  const tmdbImageUrl = `${WORKER_CONFIG.tmdbImageBaseUrl}/${size}${cleanPath}`;
  const cacheKey = new Request(c.req.url, { method: 'GET' });

  // Access Cache API
  let cache: Cache | null = null;
  try {
    cache = caches.default;
  } catch {
    cache = null;
  }

  if (cache) {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      // ETag and 304 handling
      const ifNoneMatch = c.req.header('if-none-match');
      const cachedEtag = cachedResponse.headers.get('etag');

      if (ifNoneMatch && cachedEtag && ifNoneMatch === cachedEtag) {
        return new Response(null, {
          status: 304,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cache-Control': `public, max-age=${WORKER_CONFIG.imageCacheMaxAgeSeconds}, immutable`,
            ETag: cachedEtag
          }
        });
      }

      const resHeaders = new Headers(cachedResponse.headers);
      resHeaders.set('Access-Control-Allow-Origin', '*');
      resHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers: resHeaders
      });
    }
  }

  // Fetch unmodified bytes from TMDB with clean headers
  const tmdbRes = await fetch(tmdbImageUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'Cloudflare-Worker-TMDB-Image-Proxy',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  });

  // Never cache 5xx server errors
  if (tmdbRes.status >= 500) {
    return new Response(tmdbRes.body, {
      status: tmdbRes.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cache-Control': 'no-store'
      }
    });
  }

  // 404 Not Found: pass through with short cache
  if (tmdbRes.status === 404) {
    const notFoundHeaders = new Headers();
    notFoundHeaders.set('Access-Control-Allow-Origin', '*');
    notFoundHeaders.set('Cross-Origin-Resource-Policy', 'cross-origin');
    notFoundHeaders.set('Cache-Control', `public, max-age=${WORKER_CONFIG.image404CacheMaxAgeSeconds}`);
    const notFoundResponse = new Response('Image not found on TMDB', {
      status: 404,
      headers: notFoundHeaders
    });

    if (cache) {
      c.executionCtx.waitUntil(cache.put(cacheKey, notFoundResponse.clone()));
    }
    return notFoundResponse;
  }

  // Success 200: store UNMODIFIED bytes with immutable cache header
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  headers.set('Cache-Control', `public, max-age=${WORKER_CONFIG.imageCacheMaxAgeSeconds}, immutable`);

  const contentType = tmdbRes.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const contentLength = tmdbRes.headers.get('content-length');
  if (contentLength) headers.set('Content-Length', contentLength);

  const etag = tmdbRes.headers.get('etag') || `"${size}-${cleanPath.replace(/[^a-zA-Z0-9]/g, '')}"`;
  headers.set('ETag', etag);

  const finalResponse = new Response(tmdbRes.body, {
    status: 200,
    headers
  });

  if (cache) {
    c.executionCtx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
  }

  return finalResponse;
});
