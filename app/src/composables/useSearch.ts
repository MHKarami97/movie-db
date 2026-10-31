import { ref } from 'vue';
import MiniSearch from 'minisearch';
import { DataRepository } from '../services/DataRepository.js';
import { WorkerClient } from '../services/WorkerClient.js';
import { PersianUtils } from '../services/PersianUtils.js';

export interface SearchResultItem {
  id: number;
  type: 'movie' | 'tv';
  title: string;
  originalTitle: string;
  year?: number;
  releaseDate?: string;
  posterPath?: string | null;
  rating?: number;
  voteCount?: number;
  overview?: string;
  isOnlineResult?: boolean;
}

export function useSearch() {
  const dataRepo = new DataRepository();
  const workerClient = new WorkerClient();

  const miniSearch = ref<MiniSearch | null>(null);
  const loading = ref(false);
  const isOnlineSearching = ref(false);
  const results = ref<SearchResultItem[]>([]);
  const onlineResults = ref<SearchResultItem[]>([]);

  async function initIndex() {
    if (miniSearch.value) return;
    loading.value = true;
    try {
      const indexJson = await dataRepo.getSearchIndex();
      miniSearch.value = MiniSearch.loadJSON(indexJson, {
        fields: ['title', 'originalTitle', 'faTitle', 'genres'],
        storeFields: ['title', 'originalTitle', 'faTitle', 'year', 'genres', 'type'],
        searchOptions: {
          prefix: true,
          fuzzy: 0.2
        }
      });
    } catch (err) {
      console.warn('[search] Failed to load offline search index:', err);
    } finally {
      loading.value = false;
    }
  }

  function searchOffline(query: string) {
    if (!query || query.trim() === '' || !miniSearch.value) {
      results.value = [];
      return;
    }

    const normalizedQuery = PersianUtils.normalizePersianText(query);
    const searchDocs = miniSearch.value.search(normalizedQuery);

    results.value = searchDocs.map((doc: any) => {
      const [type, idStr] = doc.id.split('-');
      return {
        id: parseInt(idStr, 10),
        type: type as 'movie' | 'tv',
        title: doc.title,
        originalTitle: doc.originalTitle,
        year: doc.year,
        isOnlineResult: false
      };
    });
  }

  async function searchOnline(query: string) {
    if (!query || query.trim() === '') return;
    isOnlineSearching.value = true;
    try {
      const res = await workerClient.searchLive(query);
      onlineResults.value = (res.results || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        originalTitle: item.originalTitle,
        releaseDate: item.releaseDate,
        posterPath: item.posterPath,
        rating: item.rating,
        voteCount: item.voteCount,
        overview: item.overview,
        isOnlineResult: true
      }));
    } catch (err) {
      console.warn('[search] Online search failed:', err);
      onlineResults.value = [];
    } finally {
      isOnlineSearching.value = false;
    }
  }

  return {
    loading,
    isOnlineSearching,
    results,
    onlineResults,
    initIndex,
    searchOffline,
    searchOnline
  };
}
