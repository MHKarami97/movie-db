import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { WorkerBindings, WORKER_CONFIG } from './config.js';
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
    exposeHeaders: ['ETag', 'Cache-Control', 'X-Cache-Status', 'X-Cache-Warning'],
    maxAge: 86400
  });
  return corsMiddleware(c, next);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'tmdb-worker',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
app.route('/', imageRoute);
app.route('/', titleRoute);
app.route('/', searchRoute);

export default {
  fetch: app.fetch,

  // Cloudflare Workers Scheduled Cron Trigger
  async scheduled(
    event: ScheduledEvent,
    env: WorkerBindings,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const nowMs = Date.now();
        const cutoffMs = nowMs - WORKER_CONFIG.d1StaleMaxDays * 86400 * 1000; // 90 days

        console.log(
          `[cron] Running daily cache cleanup. Purging entries older than ${new Date(cutoffMs).toISOString()}...`
        );

        try {
          // 1. Preserve IDs in known_ids table
          await env.DB.prepare(`
            INSERT OR IGNORE INTO known_ids (type, id, recorded_at)
            SELECT type, id, fetched_at FROM title_cache WHERE fetched_at < ?
          `).bind(cutoffMs).run();

          // 2. Delete expired metadata from title_cache
          const deleteResult = await env.DB.prepare(`
            DELETE FROM title_cache WHERE fetched_at < ?
          `).bind(cutoffMs).run();

          console.log(`[cron] Cleanup complete. Deleted ${deleteResult.meta.changes} expired rows.`);
        } catch (err) {
          console.error('[cron] Error during daily cache cleanup:', err);
        }
      })()
    );
  }
};
