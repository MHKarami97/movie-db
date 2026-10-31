import { MediaType } from '../types/index.js';

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed';

export class ShareService {
  public constructor(
    private readonly origin: string = window.location.origin,
    private readonly baseUrl: string = import.meta.env.BASE_URL
  ) {}

  public buildTitleUrl(type: MediaType, id: number): string {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return new URL(`title/${type}/${id}`, `${this.origin}${base}`).href;
  }

  public async shareTitle(type: MediaType, id: number, title: string): Promise<ShareOutcome> {
    const url = this.buildTitleUrl(type, id);

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return 'shared';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      }
    }

    return this.copyToClipboard(url);
  }

  private async copyToClipboard(text: string): Promise<ShareOutcome> {
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'failed';
    }
  }
}
