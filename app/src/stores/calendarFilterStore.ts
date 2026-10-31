import { defineStore } from 'pinia';
import { computed, reactive, watch } from 'vue';
import { JsonLocalStorage } from '../services/JsonLocalStorage.js';
import { CalendarItem, MediaType } from '../types/index.js';

export interface CalendarFilters {
  mediaType: 'all' | MediaType;
  genres: number[];
  language: string;
  country: string;
  providerId: number | null;
  releaseType: string;
  minRating: number;
  minVotes: number;
  hasTrailer: boolean;
}

const STORAGE_KEY = 'calendar_filters_v1';

function createDefaults(): CalendarFilters {
  return {
    mediaType: 'all',
    genres: [],
    language: '',
    country: '',
    providerId: null,
    releaseType: '',
    minRating: 0,
    minVotes: 0,
    hasTrailer: false
  };
}

function sanitize(raw: Partial<CalendarFilters> | null): CalendarFilters {
  const defaults = createDefaults();
  if (!raw || typeof raw !== 'object') return defaults;

  return {
    mediaType: raw.mediaType === 'movie' || raw.mediaType === 'tv' ? raw.mediaType : 'all',
    genres: Array.isArray(raw.genres) ? raw.genres.filter((g) => typeof g === 'number') : [],
    language: typeof raw.language === 'string' ? raw.language : defaults.language,
    country: typeof raw.country === 'string' ? raw.country : defaults.country,
    providerId: typeof raw.providerId === 'number' ? raw.providerId : null,
    releaseType: typeof raw.releaseType === 'string' ? raw.releaseType : defaults.releaseType,
    minRating: typeof raw.minRating === 'number' ? raw.minRating : defaults.minRating,
    minVotes: typeof raw.minVotes === 'number' ? raw.minVotes : defaults.minVotes,
    hasTrailer: Boolean(raw.hasTrailer)
  };
}

export const useCalendarFilterStore = defineStore('calendarFilter', () => {
  const storage = new JsonLocalStorage();
  const filters = reactive<CalendarFilters>(sanitize(storage.read<Partial<CalendarFilters> | null>(STORAGE_KEY, null)));

  watch(filters, () => storage.write(STORAGE_KEY, filters), { deep: true });

  // The media type is a view tab, so it is not counted as an "attribute filter".
  const activeCount = computed<number>(() => {
    let count = 0;
    if (filters.genres.length > 0) count++;
    if (filters.language) count++;
    if (filters.country) count++;
    if (filters.providerId !== null) count++;
    if (filters.releaseType) count++;
    if (filters.minRating > 0) count++;
    if (filters.minVotes > 0) count++;
    if (filters.hasTrailer) count++;
    return count;
  });

  const hasActiveFilters = computed<boolean>(() => activeCount.value > 0);

  function matches(item: CalendarItem): boolean {
    if (filters.mediaType !== 'all' && item.type !== filters.mediaType) return false;
    if (item.rating < filters.minRating) return false;
    if (item.voteCount < filters.minVotes) return false;
    if (filters.genres.length > 0 && !filters.genres.some((g) => item.genreIds.includes(g))) return false;
    if (filters.language && item.originalLanguage !== filters.language) return false;
    if (filters.country && !(item.countries ?? []).includes(filters.country)) return false;
    if (filters.providerId !== null && !(item.providers ?? []).includes(filters.providerId)) return false;
    if (filters.releaseType && !item.releaseTypes.includes(filters.releaseType)) return false;
    if (filters.hasTrailer && !item.hasTrailer) return false;
    return true;
  }

  function toggleGenre(genreId: number): void {
    const index = filters.genres.indexOf(genreId);
    if (index >= 0) filters.genres.splice(index, 1);
    else filters.genres.push(genreId);
  }

  function reset(): void {
    const keepMediaType = filters.mediaType;
    Object.assign(filters, createDefaults(), { mediaType: keepMediaType });
  }

  return { filters, activeCount, hasActiveFilters, matches, toggleGenre, reset };
});
