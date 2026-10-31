export interface RateLimiterOptions {
  concurrency: number;
  maxRetries: number;
  baseRetryDelayMs: number;
}

export class RateLimiter {
  private activeCount = 0;
  private queue: Array<() => void> = [];
  private concurrency: number;
  private maxRetries: number;
  private baseRetryDelayMs: number;

  constructor(options: RateLimiterOptions) {
    this.concurrency = options.concurrency;
    this.maxRetries = options.maxRetries;
    this.baseRetryDelayMs = options.baseRetryDelayMs;
  }

  public async schedule<T>(task: () => Promise<Response>): Promise<Response> {
    await this.acquire();
    try {
      return await this.executeWithRetry(task);
    } finally {
      this.release();
    }
  }

  private acquire(): Promise<void> {
    if (this.activeCount < this.concurrency) {
      this.activeCount++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  private release(): void {
    this.activeCount--;
    const next = this.queue.shift();
    if (next) {
      this.activeCount++;
      next();
    }
  }

  private async executeWithRetry(task: () => Promise<Response>): Promise<Response> {
    let attempt = 0;
    while (true) {
      attempt++;
      try {
        const res = await task();

        if (res.status === 429) {
          if (attempt > this.maxRetries) {
            return res;
          }
          const retryAfterHeader = res.headers.get('Retry-After');
          let delayMs = this.baseRetryDelayMs * Math.pow(2, attempt);
          if (retryAfterHeader) {
            const parsed = parseInt(retryAfterHeader, 10);
            if (!isNaN(parsed) && parsed > 0) {
              delayMs = parsed * 1000;
            }
          }
          // Add jitter (±20%)
          const jitter = delayMs * 0.2 * (Math.random() * 2 - 1);
          await this.sleep(Math.max(500, delayMs + jitter));
          continue;
        }

        if (res.status >= 500 && attempt <= this.maxRetries) {
          const delayMs = this.baseRetryDelayMs * Math.pow(2, attempt);
          const jitter = delayMs * 0.2 * (Math.random() * 2 - 1);
          await this.sleep(delayMs + jitter);
          continue;
        }

        return res;
      } catch (err: unknown) {
        if (attempt <= this.maxRetries) {
          const delayMs = this.baseRetryDelayMs * Math.pow(2, attempt);
          await this.sleep(delayMs);
          continue;
        }
        throw err;
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
