import { IDataRepository } from './interfaces.js';
import {
  CalendarItem,
  FacetsData,
  KnownId,
  MediaType,
  MetaData,
  TitleDetail
} from '../types/index.js';

export class DataRepository implements IDataRepository {
  private baseUrl: string;

  constructor(baseUrl = import.meta.env.BASE_URL || '/') {
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.baseUrl = `${cleanBase}data`;
  }

  public async getMeta(): Promise<MetaData> {
    try {
      const res = await fetch(`${this.baseUrl}/meta.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as MetaData;
    } catch {
      // Dev fixture fallback
      return this.getFixtureMeta();
    }
  }

  public async getKnownIds(): Promise<KnownId[]> {
    try {
      const res = await fetch(`${this.baseUrl}/ids.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as KnownId[];
    } catch {
      return this.getFixtureKnownIds();
    }
  }

  public async getCalendarMonth(yearMonth: string): Promise<CalendarItem[]> {
    try {
      const res = await fetch(`${this.baseUrl}/calendar/${yearMonth}.json`);
      if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as CalendarItem[];
    } catch {
      return this.getFixtureCalendar(yearMonth);
    }
  }

  public async getTitleDetail(type: MediaType, id: number): Promise<TitleDetail | null> {
    const bucket = Math.floor(id / 1000);
    try {
      const res = await fetch(`${this.baseUrl}/titles/${type}/${bucket}/${id}.json`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return (await res.json()) as TitleDetail;
    } catch {
      return this.getFixtureTitleDetail(type, id);
    }
  }

  public async getSearchIndex(): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/search/index.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return JSON.stringify(data);
    } catch {
      return JSON.stringify(this.getFixtureSearchIndex());
    }
  }

  public async getFacets(): Promise<FacetsData> {
    try {
      const res = await fetch(`${this.baseUrl}/facets/filters.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as FacetsData;
    } catch {
      return this.getFixtureFacets();
    }
  }

  // --- Offline Dev Fixtures ---
  private getFixtureMeta(): MetaData {
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      counts: {
        movies: 3,
        tv: 2,
        totalTitles: 5,
        calendarItems: 5
      },
      window: {
        start: '2025-01-01',
        end: '2028-12-31'
      }
    };
  }

  private getFixtureKnownIds(): KnownId[] {
    return [
      { type: 'movie', id: 693134 },
      { type: 'movie', id: 939243 },
      { type: 'movie', id: 533535 },
      { type: 'tv', id: 94605 },
      { type: 'tv', id: 110492 }
    ];
  }

  private getFixtureCalendar(yearMonth: string): CalendarItem[] {
    const all: CalendarItem[] = [
      {
        id: 693134,
        type: 'movie',
        title: 'تل‌ماسه: بخش دوم',
        originalTitle: 'Dune: Part Two',
        date: `${yearMonth}-01`,
        releaseTypes: ['theatrical'],
        posterPath: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
        rating: 8.2,
        voteCount: 5400,
        genreIds: [878, 12],
        originalLanguage: 'en'
      },
      {
        id: 939243,
        type: 'movie',
        title: 'سونیک ۳',
        originalTitle: 'Sonic the Hedgehog 3',
        date: `${yearMonth}-15`,
        releaseTypes: ['theatrical', 'digital'],
        posterPath: '/d8Ryb8AunYAuycVKDp5H9hXh3zR.jpg',
        rating: 7.8,
        voteCount: 1600,
        genreIds: [28, 35, 10751],
        originalLanguage: 'en'
      },
      {
        id: 94605,
        type: 'tv',
        title: 'تفکیک‌سازی (فصل دوم)',
        originalTitle: 'Severance',
        date: `${yearMonth}-17`,
        releaseTypes: ['tv'],
        posterPath: '/pG9f939z4L5x1eB9Vz08JcQx1Xy.jpg',
        rating: 8.6,
        voteCount: 2200,
        genreIds: [18, 9648, 878],
        originalLanguage: 'en'
      }
    ];
    return all;
  }

  private getFixtureTitleDetail(_type: MediaType, id: number): TitleDetail | null {
    if (id === 693134) {
      return {
        id: 693134,
        type: 'movie',
        title: 'تل‌ماسه: بخش دوم',
        originalTitle: 'Dune: Part Two',
        overview:
          'پل آتریدیس با چانی و فرمن‌ها متحد می‌شود در حالی که به دنبال انتقام از توطئه‌گرانی است که خانواده‌اش را نابود کردند...',
        tagline: 'رویاها از دل بیابان برمی‌خیزند',
        runtime: 166,
        status: 'Released',
        genres: [
          { id: 878, name: 'علمی تخیلی' },
          { id: 12, name: 'ماجراجویی' }
        ],
        countries: [{ code: 'US', name: 'ایالات متحده آمریکا' }],
        languages: [{ code: 'en', name: 'English' }],
        companies: [{ id: 923, name: 'Legendary Pictures', logoPath: '/5U252994.png' }],
        keywords: ['desert', 'prophecy', 'spice', 'sandworm'],
        cast: [
          { id: 1190668, name: 'Timothée Chalamet', character: 'Paul Atreides', profilePath: '/timothee.jpg' },
          { id: 505710, name: 'Zendaya', character: 'Chani', profilePath: '/zendaya.jpg' },
          { id: 934271, name: 'Rebecca Ferguson', character: 'Lady Jessica', profilePath: '/rebecca.jpg' }
        ],
        videos: [{ key: 'Way9Dexny3w', name: 'Official Trailer', type: 'Trailer', official: true }],
        releaseDates: {
          US: { theatrical: '2025-03-01', digital: '2025-04-16' },
          IR: { digital: '2025-04-16' }
        },
        watchProviders: {
          US: {
            link: 'https://tmdb.org/watch',
            flatrate: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }],
            rent: [{ id: 2, name: 'Apple TV', logoPath: '/apple.jpg' }],
            buy: [{ id: 3, name: 'Google Play', logoPath: '/google.jpg' }],
            free: [],
            ads: []
          }
        },
        externalIds: { imdbId: 'tt15239678' },
        translations: { faTitle: 'تل‌ماسه: بخش دوم' },
        theatricalDate: '2025-03-01',
        digitalDate: '2025-04-16',
        gapDays: 46,
        regionGaps: {
          US: { theatricalDate: '2025-03-01', digitalDate: '2025-04-16', gapDays: 46 }
        },
        posterPath: '/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg',
        backdropPath: '/xOMo8BRK7PfcJv9xY7MuG9CePPU.jpg',
        rating: 8.2,
        voteCount: 5400,
        fetchedAt: Date.now()
      };
    }
    return null;
  }

  private getFixtureSearchIndex(): any {
    return {
      index: {},
      documentCount: 0,
      nextId: 0,
      documentIds: {},
      fieldIds: {},
      fieldLength: {},
      averageFieldLength: {},
      storedFields: {}
    };
  }

  private getFixtureFacets(): FacetsData {
    return {
      titles: [
        {
          id: 693134,
          type: 'movie',
          year: 2025,
          rating: 8.2,
          voteCount: 5400,
          runtime: 166,
          genres: [878, 12],
          countries: ['US'],
          languages: ['en'],
          companies: [923],
          providers: [1899],
          hasTrailer: true,
          inCinemaNotOnline: false,
          status: 'Released',
          releaseTypes: ['theatrical', 'digital']
        }
      ],
      dictionaries: {
        genres: [
          { id: 878, name: 'علمی تخیلی' },
          { id: 12, name: 'ماجراجویی' },
          { id: 28, name: 'اکشن' }
        ],
        countries: [{ code: 'US', name: 'ایالات متحده آمریکا' }],
        languages: [{ code: 'en', name: 'انگلیسی' }],
        companies: [{ id: 923, name: 'Legendary Pictures' }],
        providers: [{ id: 1899, name: 'Max', logoPath: '/max.jpg' }]
      }
    };
  }
}
