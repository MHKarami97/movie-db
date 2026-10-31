export type MediaType = 'movie' | 'tv';

export interface KnownId {
  type: MediaType;
  id: number;
}

export interface CalendarItem {
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  date: string; // ISO YYYY-MM-DD
  releaseTypes: string[];
  posterPath: string | null;
  rating: number;
  voteCount: number;
  genreIds: number[];
  originalLanguage: string;
  countries?: string[];
  providers?: number[];
  hasTrailer?: boolean;
}

export interface RegionReleaseDates {
  premiere?: string;
  theatricalLimited?: string;
  theatrical?: string;
  digital?: string;
  physical?: string;
  tv?: string;
}

export interface ProviderItem {
  id: number;
  name: string;
  logoPath: string;
}

export interface RegionWatchProviders {
  link?: string;
  flatrate: ProviderItem[];
  rent: ProviderItem[];
  buy: ProviderItem[];
  free: ProviderItem[];
  ads: ProviderItem[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface VideoItem {
  key: string;
  name: string;
  type: string;
  official: boolean;
}

export interface TvSeasonSummary {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
  overview: string;
}

export interface TvEpisodeSummary {
  id: number;
  name: string;
  airDate: string;
  seasonNumber: number;
  episodeNumber: number;
  overview: string;
}

export interface SeasonEpisodeDetail {
  episodeNumber: number;
  name: string;
  airDate: string | null;
  overview: string;
  stillPath: string | null;
  voteAverage: number;
}

export interface RegionGap {
  theatricalDate: string | null;
  digitalDate: string | null;
  gapDays: number | null;
}

export interface TitleDetail {
  id: number;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  tagline: string;
  runtime: number | null;
  status: string;
  genres: { id: number; name: string }[];
  countries: { code: string; name: string }[];
  languages: { code: string; name: string }[];
  companies: { id: number; name: string; logoPath: string | null }[];
  keywords: string[];
  cast: CastMember[];
  videos: VideoItem[];
  releaseDates: Record<string, RegionReleaseDates>;
  watchProviders: Record<string, RegionWatchProviders>;
  externalIds: {
    imdbId?: string;
    wikidataId?: string;
    facebookId?: string;
    instagramId?: string;
    twitterId?: string;
  };
  translations: {
    faTitle?: string;
    faOverview?: string;
  };
  theatricalDate: string | null;
  digitalDate: string | null;
  gapDays: number | null;
  regionGaps: Record<string, RegionGap>;
  posterPath: string | null;
  backdropPath: string | null;
  rating: number;
  voteCount: number;
  fetchedAt: number;

  seasons?: TvSeasonSummary[];
  nextEpisodeToAir?: TvEpisodeSummary | null;
  lastEpisodeToAir?: TvEpisodeSummary | null;
  episodes?: Record<number, SeasonEpisodeDetail[]>;
}

export interface CompactFilterRecord {
  id: number;
  type: MediaType;
  title?: string;
  posterPath?: string | null;
  year: number;
  releaseDate?: string;
  rating: number;
  voteCount: number;
  runtime: number;
  genres: number[];
  countries: string[];
  languages: string[];
  companies: number[];
  providers: number[];
  hasTrailer: boolean;
  inCinemaNotOnline: boolean;
  status: string;
  releaseTypes: string[];
}

export interface FacetDictionaries {
  genres: { id: number; name: string }[];
  countries: { code: string; name: string }[];
  languages: { code: string; name: string }[];
  companies: { id: number; name: string }[];
  providers: { id: number; name: string; logoPath: string }[];
}

export interface FacetsData {
  titles: CompactFilterRecord[];
  dictionaries: FacetDictionaries;
}

export interface MetaData {
  schemaVersion: number;
  generatedAt: string;
  counts: {
    movies: number;
    tv: number;
    totalTitles: number;
    calendarItems: number;
  };
  window: {
    start: string;
    end: string;
  };
}

// IndexedDB Models
export interface ListItemRecord {
  type: MediaType;
  id: number;
  addedAt: number;
  watched?: boolean;
  title?: string;
  posterPath?: string | null;
}

export interface CustomList {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  items: ListItemRecord[];
}
