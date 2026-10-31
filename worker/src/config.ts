export interface WorkerBindings {
  DB: D1Database;
  TMDB_READ_TOKEN: string;
  ALLOWED_ORIGIN?: string;
}

// Officially documented TMDB image sizes from /configuration
export const ALLOWED_IMAGE_SIZES = new Set([
  'w45',
  'w92',
  'w154',
  'w185',
  'w300',
  'w342',
  'w500',
  'w780',
  'w1280',
  'h632',
  'original'
]);

export const WORKER_CONFIG = {
  tmdbApiBaseUrl: 'https://api.themoviedb.org/3',
  tmdbImageBaseUrl: 'https://image.tmdb.org/t/p',
  imageCacheMaxAgeSeconds: 7776000, // 90 days (TMDB terms compliant)
  image404CacheMaxAgeSeconds: 300, // 5 minutes
  searchEdgeCacheSeconds: 300, // 5 minutes
  d1FreshnessDays: 30, // Re-fetch from TMDB if older than 30 days
  d1StaleMaxDays: 90, // Hard purge from D1 after 90 days
  configuredRegions: ['US', 'GB', 'DE', 'IR', 'CA']
};
