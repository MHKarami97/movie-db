import { RateLimiter } from './RateLimiter.js';
import { CONFIG } from '../config.js';

export interface ITmdbClient {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T>;
}

export class TmdbClient implements ITmdbClient {
  private token: string;
  private baseUrl: string;
  private rateLimiter: RateLimiter;
  private timeoutMs: number;

  constructor(token?: string, rateLimiter?: RateLimiter) {
    const resolvedToken = token || process.env.TMDB_READ_TOKEN;
    if (!resolvedToken || resolvedToken.trim() === '') {
      throw new Error(
        'TMDB_READ_TOKEN is missing or empty. Please set the TMDB_READ_TOKEN environment variable with a valid TMDB API Read Access Token (v4 auth).'
      );
    }
    this.token = resolvedToken.trim();
    this.baseUrl = CONFIG.tmdbApiBaseUrl;
    this.timeoutMs = CONFIG.requestTimeoutMs;
    this.rateLimiter =
      rateLimiter ||
      new RateLimiter({
        concurrency: CONFIG.concurrencyLimit,
        maxRetries: CONFIG.maxRetries,
        baseRetryDelayMs: CONFIG.baseRetryDelayMs
      });
  }

  public async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await this.rateLimiter.schedule(async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        return await fetch(url.toString(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: 'application/json'
          },
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }
    });

    if (response.status === 401) {
      throw new Error(
        `TMDB API 401 Unauthorized: The provided TMDB_READ_TOKEN is invalid or expired. Check your token at themoviedb.org.`
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `TMDB API request failed [${response.status} ${response.statusText}] for ${url.pathname}: ${errorText}`
      );
    }

    return (await response.json()) as T;
  }
}
