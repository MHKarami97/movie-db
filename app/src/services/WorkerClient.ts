import { IWorkerClient } from './interfaces.js';
import { MediaType, TitleDetail } from '../types/index.js';

export class WorkerClient implements IWorkerClient {
  private workerUrl: string;

  constructor(workerUrl = import.meta.env.VITE_WORKER_URL || '') {
    // If not configured, use empty prefix (relative URL) or default
    this.workerUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
  }

  public getImageUrl(size: string, imagePath: string | null): string {
    if (!imagePath) return '';
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    if (!this.workerUrl) {
      // Direct TMDB fallback if worker URL is not configured
      return `https://image.tmdb.org/t/p/${size}${cleanPath}`;
    }
    return `${this.workerUrl}/img/${size}${cleanPath}`;
  }

  public async getTitleDetail(type: MediaType, id: number): Promise<TitleDetail> {
    const url = `${this.workerUrl}/api/title/${type}/${id}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Worker title request failed with status ${res.status}`);
    }
    return (await res.json()) as TitleDetail;
  }

  public async searchLive(query: string): Promise<{ results: any[] }> {
    const url = `${this.workerUrl}/api/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Worker search failed with status ${res.status}`);
    }
    return (await res.json()) as { results: any[] };
  }
}
