export interface SyncConfig {
  schemaVersion: number;
  yearsPast: number;
  yearsFuture: number;
  maxCacheAgeDays: number;
  retentionOutOfWindowDays: number;
  refreshBudgetPerRun: number;
  concurrencyLimit: number;
  requestTimeoutMs: number;
  maxRetries: number;
  baseRetryDelayMs: number;
  configuredRegions: string[];
  titleSchemaVersion: number;
  tmdbApiBaseUrl: string;
  minPopularity: number;
  minVoteCountPast: number;
  minMovieRuntimeMinutes: number;
  maxPagesPerSlice: number;
}

export const CONFIG: SyncConfig = {
  schemaVersion: 1,
  yearsPast: 1,
  yearsFuture: 2,
  maxCacheAgeDays: 90,
  retentionOutOfWindowDays: 150,
  refreshBudgetPerRun: 200,
  concurrencyLimit: 12,
  requestTimeoutMs: 15000,
  maxRetries: 4,
  baseRetryDelayMs: 600,
  configuredRegions: ['US', 'GB', 'CN', 'AE'],
  // Bump to force every stored title to be re-fetched (e.g. after fixing normalization).
  titleSchemaVersion: 2,
  tmdbApiBaseUrl: 'https://api.themoviedb.org/3',
  minPopularity: 1.0,
  minVoteCountPast: 5,
  minMovieRuntimeMinutes: 40,
  maxPagesPerSlice: 15
};
