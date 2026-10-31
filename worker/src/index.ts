import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { WorkerBindings } from './config.js';
import { imageRoute } from './routes/image.js';
import { titleRoute } from './routes/title.js';
import { searchRoute } from './routes/search.js';

const app = new Hono<{ Bindings: WorkerBindings }>();

// Global CORS middleware
app.use('*', async (c, next) => {
  const allowedOrigin = c.env.ALLOWED_ORIGIN || '*';
  const corsMiddleware = cors({
    origin: allowedOrigin,
    allowMethods: ['GET', 'HEAD', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'If-None-Match', 'Authorization'],
    exposeHeaders: ['ETag', 'Cache-Control', 'X-Cache-Status'],
    maxAge: 86400
  });
  return corsMiddleware(c, next);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'tmdb-worker',
    mode: 'zero-d1-cache',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.route('/', imageRoute);
app.route('/', titleRoute);
app.route('/', searchRoute);

export default {
  fetch: app.fetch
};
