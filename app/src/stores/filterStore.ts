import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { JsonLocalStorage } from '../services/JsonLocalStorage.js';
import { TitleSorter, SortKey } from '../services/TitleSorter.js';
import { DataRepository } from '../services/DataRepository.js';
import { CompactFilterRecord, FacetDictionaries } from '../types/index.js';

export const useFilterStore = defineStore('filter', () => {
  const dataRepo = new DataRepository();
  const storage = new JsonLocalStorage();
  const sorter = new TitleSorter();
  const SORT_STORAGE_KEY = 'search_sort_v1';
  const sortKey = ref<SortKey>(TitleSorter.sanitize(storage.read<string | null>(SORT_STORAGE_KEY, null)));
  watch(sortKey, (value) => storage.write(SORT_STORAGE_KEY, value));

  const titles = ref<CompactFilterRecord[]>([]);
  const dictionaries = ref<FacetDictionaries>({
    genres: [],
    countries: [],
    languages: [],
    companies: [],
    providers: []
  });
  const loading = ref(false);

  // Filter state
  const typeFilter = ref<'all' | 'movie' | 'tv'>('all');
  const selectedGenres = ref<number[]>([]);
  const minRating = ref<number>(0);
  const minVotes = ref<number>(0);
  const yearFrom = ref<number>(1900);
  const yearTo = ref<number>(2035);
  const selectedCountry = ref<string>('');
  const selectedLanguage = ref<string>('');
  const selectedCompany = ref<number | null>(null);
  const selectedProvider = ref<number | null>(null);
  const inCinemaNotOnline = ref<boolean>(false);
  const hasTrailer = ref<boolean>(false);
  const selectedReleaseType = ref<string>('');

  async function loadFacets() {
    if (titles.value.length > 0) return;
    loading.value = true;
    try {
      const data = await dataRepo.getFacets();
      titles.value = data.titles;
      dictionaries.value = data.dictionaries;
    } finally {
      loading.value = false;
    }
  }

  const filteredTitles = computed<CompactFilterRecord[]>(() => {
    return titles.value.filter((t) => {
      if (typeFilter.value !== 'all' && t.type !== typeFilter.value) return false;
      if (t.rating < minRating.value) return false;
      if (t.voteCount < minVotes.value) return false;
      if (t.year > 0 && (t.year < yearFrom.value || t.year > yearTo.value)) return false;
      if (inCinemaNotOnline.value && !t.inCinemaNotOnline) return false;
      if (hasTrailer.value && !t.hasTrailer) return false;

      if (selectedGenres.value.length > 0) {
        const hasAllGenres = selectedGenres.value.every((gId) => t.genres.includes(gId));
        if (!hasAllGenres) return false;
      }

      if (selectedCountry.value && !t.countries.includes(selectedCountry.value)) return false;
      if (selectedLanguage.value && !t.languages.includes(selectedLanguage.value)) return false;
      if (selectedCompany.value && !t.companies.includes(selectedCompany.value)) return false;
      if (selectedProvider.value && !t.providers.includes(selectedProvider.value)) return false;
      if (selectedReleaseType.value && !t.releaseTypes.includes(selectedReleaseType.value)) return false;

      return true;
    });
  });

  const sortedTitles = computed<CompactFilterRecord[]>(() => sorter.sort(filteredTitles.value, sortKey.value));

  function resetFilters() {
    typeFilter.value = 'all';
    selectedGenres.value = [];
    minRating.value = 0;
    minVotes.value = 0;
    yearFrom.value = 1900;
    yearTo.value = 2035;
    selectedCountry.value = '';
    selectedLanguage.value = '';
    selectedCompany.value = null;
    selectedProvider.value = null;
    inCinemaNotOnline.value = false;
    hasTrailer.value = false;
    selectedReleaseType.value = '';
  }

  return {
    titles,
    dictionaries,
    loading,
    typeFilter,
    selectedGenres,
    minRating,
    minVotes,
    yearFrom,
    yearTo,
    selectedCountry,
    selectedLanguage,
    selectedCompany,
    selectedProvider,
    inCinemaNotOnline,
    hasTrailer,
    selectedReleaseType,
    filteredTitles,
    sortKey,
    sortedTitles,
    loadFacets,
    resetFilters
  };
});
