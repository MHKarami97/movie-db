import { ITmdbClient } from '../client/TmdbClient.js';
import { TitleDetail } from '../types.js';
import { Normalizer } from './Normalizer.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class TitleFetcher {
  private client: ITmdbClient;

  constructor(client: ITmdbClient) {
    this.client = client;
  }

  public async fetchMovie(id: number, fetchedAt = Date.now()): Promise<TitleDetail> {
    const raw = await this.client.get<any>(`/movie/${id}`, {
      language: 'en-US',
      append_to_response: 'videos,credits,release_dates,watch/providers,external_ids,translations'
    });
    return Normalizer.normalizeMovie(raw, fetchedAt);
  }

  public async fetchTv(
    id: number,
    windowStart?: Date,
    fetchedAt = Date.now()
  ): Promise<TitleDetail> {
    const raw = await this.client.get<any>(`/tv/${id}`, {
      language: 'en-US',
      append_to_response: 'videos,credits,watch/providers,external_ids,translations'
    });

    const seasonEpisodesMap: Record<number, any[]> = {};

    // Fetch season details for upcoming/recent seasons only
    if (raw.seasons && Array.isArray(raw.seasons)) {
      const nowMs = Date.now();
      const cutoffMs = windowStart ? windowStart.getTime() : nowMs - 365 * 86400 * 1000;

      for (const season of raw.seasons) {
        const sNum = season.season_number;
        if (sNum <= 0) continue; // Skip specials

        const airDateMs = season.air_date ? new Date(season.air_date).getTime() : Infinity;
        // If season airs within window or in future, or has no air date yet
        if (isNaN(airDateMs) || airDateMs >= cutoffMs) {
          try {
            const seasonData = await this.client.get<any>(`/tv/${id}/season/${sNum}`, { language: 'en-US' });
            if (seasonData?.episodes) {
              seasonEpisodesMap[sNum] = seasonData.episodes;
            }
          } catch {
            // Non-critical if specific season fetch fails
          }
        }
      }
    }

    return Normalizer.normalizeTv(raw, seasonEpisodesMap, fetchedAt);
  }
}
