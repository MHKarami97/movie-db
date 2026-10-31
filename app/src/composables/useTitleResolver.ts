import { ref } from 'vue';
import { DataRepository } from '../services/DataRepository.js';
import { MediaType } from '../types/index.js';

export interface ResolvedTitleMeta {
  title: string;
  posterPath: string | null;
  year?: number;
}

// Global shared title & poster cache across all views
const titleCache = ref<Map<string, ResolvedTitleMeta>>(new Map());
const inFlightRequests = new Set<string>();
const dataRepo = new DataRepository();
let indexLoaded = false;

export function useTitleResolver() {
  async function loadIndexTitles() {
    if (indexLoaded) return;
    try {
      const indexJson = await dataRepo.getSearchIndex();
      const parsed = JSON.parse(indexJson);
      if (parsed.documentIds && parsed.storedFields) {
        for (const [idx, docId] of Object.entries(parsed.documentIds)) {
          const fields = parsed.storedFields[idx];
          if (fields && docId) {
            const existing = titleCache.value.get(docId as string);
            titleCache.value.set(docId as string, {
              title: fields.originalTitle || fields.title,
              posterPath: fields.posterPath || existing?.posterPath || null,
              year: fields.year
            });
          }
        }
      }
      indexLoaded = true;
    } catch {
      // Non-critical if offline search index fails to load
    }
  }

  async function resolveTitleAsync(type: MediaType | string, id: number): Promise<ResolvedTitleMeta | null> {
    const key = `${type}-${id}`;
    const cached = titleCache.value.get(key);
    if (cached && cached.title && cached.posterPath !== undefined) {
      return cached;
    }

    if (inFlightRequests.has(key)) return null;
    inFlightRequests.add(key);

    try {
      const detail = await dataRepo.getTitleDetail(type as MediaType, id);
      if (detail) {
        const meta: ResolvedTitleMeta = {
          title: detail.originalTitle || detail.title,
          posterPath: detail.posterPath || null,
          year: detail.theatricalDate ? parseInt(detail.theatricalDate.slice(0, 4), 10) : undefined
        };
        titleCache.value.set(key, meta);
        return meta;
      }
    } catch {
      // Fallback handled gracefully
    } finally {
      inFlightRequests.delete(key);
    }
    return null;
  }

  function getTitle(type: MediaType | string, id: number, fallback?: string): string {
    const key = `${type}-${id}`;
    const cached = titleCache.value.get(key);
    if (cached?.title) {
      return cached.title;
    }
    if (fallback) {
      return fallback;
    }
    // Asynchronously resolve in background
    resolveTitleAsync(type, id);
    return '...';
  }

  function getPosterPath(type: MediaType | string, id: number, fallback?: string | null): string | null {
    const key = `${type}-${id}`;
    const cached = titleCache.value.get(key);
    if (cached?.posterPath !== undefined && cached.posterPath !== null) {
      return cached.posterPath;
    }
    if (fallback) {
      return fallback;
    }
    // Asynchronously resolve in background
    resolveTitleAsync(type, id);
    return null;
  }

  function getYear(type: MediaType | string, id: number): number | null {
    const key = `${type}-${id}`;
    return titleCache.value.get(key)?.year || null;
  }

  return {
    titleCache,
    loadIndexTitles,
    resolveTitleAsync,
    getTitle,
    getPosterPath,
    getYear
  };
}
