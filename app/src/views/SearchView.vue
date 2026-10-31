<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSearch } from '../composables/useSearch.js';
import { useTitleResolver } from '../composables/useTitleResolver.js';
import { useFilterStore } from '../stores/filterStore.js';
import { WorkerClient } from '../services/WorkerClient.js';
import { PersianUtils } from '../services/PersianUtils.js';
import SvgIcon from '../components/common/SvgIcon.vue';
import EmptyState from '../components/common/EmptyState.vue';
import PosterImage from '../components/common/PosterImage.vue';
import { useInfiniteScroll } from '../composables/useInfiniteScroll.js';
import { SORT_OPTIONS } from '../services/TitleSorter.js';
import FilterDrawer from '../components/filter/FilterDrawer.vue';

const route = useRoute();
const router = useRouter();
const { isOnlineSearching, results, onlineResults, initIndex, searchOffline, searchOnline } = useSearch();
const { getTitle, getPosterPath, loadIndexTitles } = useTitleResolver();
const filterStore = useFilterStore();
const workerClient = new WorkerClient();

const searchQuery = ref<string>((route.query.q as string) || '');
const showFilters = ref(false);

const { visibleCount, reset: resetVisible } = useInfiniteScroll(() => filterStore.sortedTitles.length);
const visibleTitles = computed(() => filterStore.sortedTitles.slice(0, visibleCount.value));

// Any change in filters or sort restarts the list from the top.
watch(() => filterStore.sortedTitles, resetVisible);

onMounted(async () => {
  await Promise.all([initIndex(), filterStore.loadFacets(), loadIndexTitles()]);
  if (searchQuery.value) {
    searchOffline(searchQuery.value);
  }
});

watch(searchQuery, (newVal) => {
  searchOffline(newVal);
  router.replace({ query: { ...route.query, q: newVal || undefined } });
});

function handleSearchOnline() {
  if (searchQuery.value.trim()) {
    searchOnline(searchQuery.value.trim());
  }
}

function getPoster(path: string | null | undefined): string {
  return workerClient.getImageUrl('w185', path ?? null);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Search Bar & Filter Button -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1">
        <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
          <SvgIcon name="search" size="18" />
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="جستجوی نام فیلم، سریال، بازیگر یا ژانر..."
          class="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-10 py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-lg"
          aria-label="جستجوی فیلم و سریال"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          aria-label="پاک کردن متن جستجو"
        >
          <SvgIcon name="close" size="16" />
        </button>
      </div>

      <button
        type="button"
        @click="showFilters = true"
        class="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold transition shadow-lg shrink-0"
      >
        <SvgIcon name="filter" size="18" className="text-amber-400" />
        <span class="hidden sm:inline">فیلترها</span>
        <span
          v-if="filterStore.selectedGenres.length > 0 || filterStore.minRating > 0 || filterStore.inCinemaNotOnline"
          class="h-2 w-2 rounded-full bg-amber-400"
        ></span>
      </button>
    </div>

    <!-- Active Search Mode -->
    <div v-if="searchQuery.trim()" class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-200">
          نتایج جستجوی آفلاین برای: «{{ searchQuery }}»
        </h3>
        <button
          type="button"
          @click="handleSearchOnline"
          :disabled="isOnlineSearching"
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold transition disabled:opacity-50"
        >
          <SvgIcon name="globe" size="14" />
          <span>{{ isOnlineSearching ? 'در حال جستجو...' : 'جستجوی آنلاین در کل عناوین' }}</span>
        </button>
      </div>

      <!-- Offline Results -->
      <div v-if="results.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <router-link
          v-for="item in results"
          :key="item.type + '-' + item.id"
          :to="`/title/${item.type}/${item.id}`"
          class="group rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition p-3 space-y-2.5 flex flex-col justify-between"
        >
          <div class="aspect-[2/3] w-full rounded-xl overflow-hidden relative">
            <PosterImage
              :src="getPoster(getPosterPath(item.type, item.id, item.posterPath))"
              :alt="item.title"
              img-class="group-hover:scale-105 transition duration-300"
            />
          </div>
          <div>
            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 mb-1 inline-block">
              {{ item.type === 'movie' ? 'فیلم' : 'سریال' }}
            </span>
            <h4 class="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition truncate text-right" dir="ltr">
              {{ item.title || item.originalTitle }}
            </h4>
          </div>
        </router-link>
      </div>

      <!-- Online Results if triggered -->
      <div v-if="onlineResults.length > 0" class="space-y-4 pt-6 border-t border-slate-800">
        <h4 class="text-sm font-bold text-amber-400 flex items-center gap-2">
          <SvgIcon name="globe" size="16" />
          <span>نتایج جستجوی آنلاین:</span>
        </h4>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <router-link
            v-for="item in onlineResults"
            :key="'online-' + item.type + '-' + item.id"
            :to="`/title/${item.type}/${item.id}`"
            class="group rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition p-3 space-y-2.5 flex flex-col justify-between"
          >
            <div class="aspect-[2/3] w-full rounded-xl overflow-hidden relative">
              <PosterImage :src="getPoster(item.posterPath)" :alt="item.title" img-class="group-hover:scale-105 transition duration-300" />
            </div>
            <div>
              <h4 class="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition truncate text-right" dir="ltr">
                {{ item.title || item.originalTitle }}
              </h4>
              <div class="flex items-center gap-1 text-[11px] text-amber-400 font-bold mt-1">
                <SvgIcon name="star" size="12" className="text-amber-400 fill-amber-400" />
                <span>{{ PersianUtils.toPersianDigits(item.rating || 0) }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <EmptyState
        v-if="results.length === 0 && onlineResults.length === 0 && !isOnlineSearching"
        icon="search"
        title="عنوانی یافت نشد"
        description="می‌توانید دکمه «جستجو در کل TMDB» را امتحان کنید تا عناوین فراتر از پنجره آفلاین نیز بررسی شوند."
      />
    </div>

    <!-- Filtered Catalog Mode (when search input is empty) -->
    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
          <span>عناوین فیلتر شده</span>
          <span class="text-xs text-slate-400">
            ({{ PersianUtils.toPersianDigits(filterStore.filteredTitles.length) }} عنوان)
          </span>
        </h3>

        <div class="flex items-center gap-3">
          <label for="sort-select" class="sr-only">مرتب‌سازی</label>
          <select
            id="sort-select"
            v-model="filterStore.sortKey"
            class="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option v-for="o in SORT_OPTIONS" :key="o.key" :value="o.key">{{ o.label }}</option>
          </select>
        <button
          v-if="filterStore.selectedGenres.length > 0 || filterStore.minRating > 0 || filterStore.inCinemaNotOnline"
          type="button"
          @click="filterStore.resetFilters()"
          class="text-xs text-amber-400 hover:underline"
        >
          پاک کردن فیلترها
        </button>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <router-link
          v-for="item in visibleTitles"
          :key="item.type + '-' + item.id"
          :to="`/title/${item.type}/${item.id}`"
          class="group rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition p-3 flex flex-col justify-between space-y-2.5"
        >
          <div class="aspect-[2/3] w-full rounded-xl overflow-hidden relative border border-slate-800">
            <PosterImage
              :src="getPoster(getPosterPath(item.type, item.id, item.posterPath))"
              :alt="getTitle(item.type, item.id, item.title)"
              img-class="group-hover:scale-105 transition duration-300"
            />
          </div>

          <div class="space-y-1">
            <div class="flex items-center justify-between text-[10px]">
              <span class="font-bold text-slate-300">
                {{ item.type === 'movie' ? 'فیلم' : 'سریال' }}
              </span>
              <span class="font-mono text-amber-400 font-bold">
                {{ PersianUtils.toPersianDigits(item.rating) }} ★
              </span>
            </div>

            <h4 class="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition truncate text-right" dir="ltr">
              {{ getTitle(item.type, item.id, item.title) }}
            </h4>

            <span
              v-if="item.inCinemaNotOnline"
              class="inline-block px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30"
            >
              در حال اکران سینما
            </span>
          </div>
        </router-link>
      </div>

      <div v-if="visibleTitles.length < filterStore.sortedTitles.length" ref="sentinel" class="flex justify-center py-6" aria-hidden="true">
        <span class="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400"></span>
      </div>
    </div>

    <!-- Filter Drawer Modal -->
    <FilterDrawer :open="showFilters" @close="showFilters = false" />
  </div>
</template>
