import { ITmdbClient } from '../client/TmdbClient.js';
import { KnownId, MediaType } from '../types.js';

export interface DateSlice {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface DiscoverResultPage {
  page: number;
  results: Array<{ id: number }>;
  total_pages: number;
  total_results: number;
}

export class DiscoverService {
  private client: ITmdbClient;

  constructor(client: ITmdbClient) {
    this.client = client;
  }

  public generateMonthlySlices(windowStart: Date, windowEnd: Date): DateSlice[] {
    const slices: DateSlice[] = [];
    const current = new Date(windowStart.getFullYear(), windowStart.getMonth(), 1);

    while (current <= windowEnd) {
      const year = current.getFullYear();
      const month = current.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      slices.push({
        startDate: this.formatDate(firstDay),
        endDate: this.formatDate(lastDay)
      });

      current.setMonth(current.getMonth() + 1);
    }

    return slices;
  }

  public async discoverAllInWindow(windowStart: Date, windowEnd: Date): Promise<KnownId[]> {
    const slices = this.generateMonthlySlices(windowStart, windowEnd);
    const discoveredMap = new Map<string, KnownId>();

    for (const slice of slices) {
      const movieIds = await this.discoverSliceWithSubdivision('movie', slice);
      for (const id of movieIds) {
        discoveredMap.set(`movie-${id}`, { type: 'movie', id });
      }

      const tvIds = await this.discoverSliceWithSubdivision('tv', slice);
      for (const id of tvIds) {
        discoveredMap.set(`tv-${id}`, { type: 'tv', id });
      }
    }

    return Array.from(discoveredMap.values());
  }

  private async discoverSliceWithSubdivision(
    type: MediaType,
    slice: DateSlice
  ): Promise<number[]> {
    const firstPage = await this.fetchDiscoverPage(type, slice, 1);
    const ids: number[] = (firstPage.results || []).map((r) => r.id);

    // TMDB has a hard limit: page must be <= 500
    if (firstPage.total_pages > 500) {
      const midDate = this.getMidpointDate(slice.startDate, slice.endDate);
      if (midDate !== slice.startDate && midDate !== slice.endDate) {
        const sliceA = { startDate: slice.startDate, endDate: midDate };
        const sliceB = {
          startDate: this.addDays(midDate, 1),
          endDate: slice.endDate
        };
        const idsA = await this.discoverSliceWithSubdivision(type, sliceA);
        const idsB = await this.discoverSliceWithSubdivision(type, sliceB);
        return Array.from(new Set([...idsA, ...idsB]));
      }
    }

    const pagesToFetch = Math.min(firstPage.total_pages, 500);
    for (let page = 2; page <= pagesToFetch; page++) {
      const nextPage = await this.fetchDiscoverPage(type, slice, page);
      for (const r of nextPage.results || []) {
        ids.push(r.id);
      }
    }

    return Array.from(new Set(ids));
  }

  private async fetchDiscoverPage(
    type: MediaType,
    slice: DateSlice,
    page: number
  ): Promise<DiscoverResultPage> {
    const endpoint = type === 'movie' ? '/discover/movie' : '/discover/tv';
    const params: Record<string, string | number> = {
      page,
      include_adult: 'false'
    };

    if (type === 'movie') {
      params['primary_release_date.gte'] = slice.startDate;
      params['primary_release_date.lte'] = slice.endDate;
      params['sort_by'] = 'primary_release_date.asc,popularity.desc';
    } else {
      params['air_date.gte'] = slice.startDate;
      params['air_date.lte'] = slice.endDate;
      params['sort_by'] = 'air_date.asc,popularity.desc';
    }

    return await this.client.get<DiscoverResultPage>(endpoint, params);
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private getMidpointDate(start: string, end: string): string {
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    const mid = new Date((s + e) / 2);
    return this.formatDate(mid);
  }

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }
}
