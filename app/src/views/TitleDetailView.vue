<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { MediaType, TitleDetail } from '../types/index.js';
import { DataRepository } from '../services/DataRepository.js';
import { WorkerClient } from '../services/WorkerClient.js';
import { PersianUtils } from '../services/PersianUtils.js';
import { useCountdown } from '../composables/useCountdown.js';
import { useListStore } from '../stores/listStore.js';
import { useSettingsStore } from '../stores/settingsStore.js';
import SvgIcon from '../components/common/SvgIcon.vue';
import PosterImage from '../components/common/PosterImage.vue';
import ShareButton from '../components/common/ShareButton.vue';
import SkeletonCard from '../components/common/SkeletonCard.vue';
import GapBadge from '../components/title/GapBadge.vue';
import ReleaseTimeline from '../components/title/ReleaseTimeline.vue';
import WatchProviders from '../components/title/WatchProviders.vue';
import CastList from '../components/title/CastList.vue';
import SeasonList from '../components/title/SeasonList.vue';
import AddToListModal from '../components/title/AddToListModal.vue';

const route = useRoute();
const dataRepo = new DataRepository();
const workerClient = new WorkerClient();
const listStore = useListStore();
const settingsStore = useSettingsStore();

const title = ref<TitleDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showAddModal = ref(false);

const mediaType = computed(() => route.params.type as MediaType);
const titleId = computed(() => parseInt(route.params.id as string, 10));

// Target date for countdown: next episode date or digital/theatrical date
const targetCountdownDate = computed(() => {
  if (!title.value) return '';
  if (title.value.type === 'tv' && title.value.nextEpisodeToAir?.airDate) {
    return title.value.nextEpisodeToAir.airDate;
  }
  return title.value.digitalDate || title.value.theatricalDate || '';
});

const { countdown } = useCountdown(() => targetCountdownDate.value);

async function loadTitle() {
  loading.value = true;
  error.value = null;
  try {
    // 1. Attempt loading from git data branch
    let detail = await dataRepo.getTitleDetail(mediaType.value, titleId.value);

    // 2. If not found in git data branch, fall back to Cloudflare Worker
    if (!detail) {
      detail = await workerClient.getTitleDetail(mediaType.value, titleId.value);
    }

    title.value = detail;
  } catch (err) {
    error.value = 'اطلاعات این عنوان در دسترس نیست یا بارگذاری با خطا مواجه شد.';
    console.error('[TitleDetail] Error:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadTitle();
});

watch(() => route.params.id, () => {
  loadTitle();
});

const primaryTrailer = computed(() => {
  if (!title.value?.videos) return null;
  return (
    title.value.videos.find((v) => v.type === 'Trailer' && v.official) ||
    title.value.videos.find((v) => v.type === 'Trailer') ||
    title.value.videos[0] ||
    null
  );
});

function getBackdrop(path: string | null): string {
  return workerClient.getImageUrl('w780', path);
}

function getPoster(path: string | null): string {
  return workerClient.getImageUrl('w500', path);
}
</script>

<template>
  <div class="space-y-8">
    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-6">
      <div class="h-64 sm:h-96 bg-slate-900 rounded-3xl animate-pulse"></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SkeletonCard />
        <div class="md:col-span-2 space-y-4">
          <div class="h-8 bg-slate-800 rounded w-2/3 animate-pulse"></div>
          <div class="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
          <div class="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error || !title"
      class="p-8 text-center rounded-2xl border border-rose-800/40 bg-rose-950/20 text-rose-300 space-y-4"
    >
      <p class="text-sm">{{ error || 'عنوان یافت نشد.' }}</p>
      <router-link
        to="/"
        class="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
      >
        بازگشت به تقویم
      </router-link>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6 sm:space-y-8">
      <!-- Hero Banner with Backdrop -->
      <div class="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl min-h-[340px] md:min-h-[440px] flex items-end">
        <!-- Backdrop Image with Gradient Overlay -->
        <div v-if="title.backdropPath" class="absolute inset-0 z-0">
          <img
            :src="getBackdrop(title.backdropPath)"
            :alt="title.title"
            class="h-full w-full object-cover opacity-25 filter blur-[1px]"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        </div>

        <!-- Banner Content -->
        <div class="relative z-10 w-full p-4 sm:p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-5 md:gap-8">
          <!-- Poster -->
          <div class="w-36 sm:w-48 md:w-56 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-800">
            <PosterImage
              :src="getPoster(title.posterPath)"
              :alt="title.title"
              :icon-size="48"
              eager
            />
          </div>

          <!-- Title Details Header -->
          <div class="flex-1 space-y-3 text-center md:text-right w-full min-w-0">
            <!-- Badges Row -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2">
              <span
                class="px-2.5 py-1 rounded-lg text-xs font-bold"
                :class="title.type === 'movie' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'"
              >
                {{ title.type === 'movie' ? 'فیلم سینمایی' : 'سریال تلویزیونی' }}
              </span>
              <span class="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                {{ title.status }}
              </span>
              <span v-if="title.runtime" class="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                {{ PersianUtils.toPersianDigits(title.runtime) }} دقیقه
              </span>
              <div class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                <SvgIcon name="star" size="14" className="text-amber-400 fill-amber-400" />
                <span>{{ PersianUtils.toPersianDigits(title.rating) }}</span>
                <span class="text-slate-500 text-[10px] font-normal">({{ PersianUtils.toPersianDigits(title.voteCount) }})</span>
              </div>
            </div>

            <!-- Title -->
            <div class="space-y-1">
              <h1 class="text-xl sm:text-3xl md:text-4xl font-extrabold text-slate-100 tracking-tight leading-snug break-words text-center md:text-right" dir="ltr">
                {{ title.title || title.originalTitle }}
              </h1>
            </div>

            <!-- Tagline -->
            <p v-if="title.tagline" class="text-xs sm:text-sm text-amber-400/90 italic font-medium">
              «{{ title.tagline }}»
            </p>

            <!-- Actions Row: Add to List, Favorites, Trailer Link -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 pt-2">
              <!-- Add to Favorites Toggle -->
              <button
                type="button"
                @click="listStore.toggleFavorite(title.type, title.id, title.title || title.originalTitle, title.posterPath)"
                class="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold transition border"
                :class="[
                  listStore.isFavorite(title.type, title.id)
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-slate-900/80 text-slate-200 border-slate-700 hover:bg-slate-800'
                ]"
              >
                <SvgIcon
                  name="heart"
                  size="16"
                  :className="listStore.isFavorite(title.type, title.id) ? 'text-rose-400 fill-rose-400' : 'text-slate-400'"
                />
                <span>{{ listStore.isFavorite(title.type, title.id) ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی' }}</span>
              </button>

              <!-- Add to Custom List Modal -->
              <button
                type="button"
                @click="showAddModal = true"
                class="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
              >
                <SvgIcon name="bookmark" size="16" />
                <span>افزودن به لیست...</span>
              </button>

              <ShareButton :type="title.type" :id="title.id" :title="title.title || title.originalTitle" />

              <!-- Official YouTube Trailer Link -->
              <a
                v-if="primaryTrailer"
                :href="`https://www.youtube.com/watch?v=${primaryTrailer.key}`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/20"
              >
                <SvgIcon name="play" size="16" className="fill-white" />
                <span>مشاهده تریلر</span>
                <SvgIcon name="external-link" size="12" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Release Countdown Banner -->
      <div
        v-if="!countdown.isPast"
        class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <SvgIcon name="clock" size="20" />
          </div>
          <div>
            <span class="text-xs font-semibold text-amber-400 block">شمارش معکوس زنده تا انتشار:</span>
            <h4 class="text-sm font-bold text-slate-100">
              {{ title.type === 'tv' && title.nextEpisodeToAir ? 'پخش قسمت جدید' : 'انتشار نسخه آنلاین/سینمایی' }}
            </h4>
          </div>
        </div>

        <div class="text-xs sm:text-sm font-extrabold text-amber-300 font-mono bg-slate-950/80 border border-amber-500/30 px-3.5 py-2 rounded-xl text-center w-full sm:w-auto">
          {{ countdown.formatted }}
        </div>
      </div>

      <!-- Gap Days Badge -->
      <div v-if="title.gapDays !== null">
        <GapBadge
          :gap-days="title.gapDays"
          :theatrical-date="title.theatricalDate"
          :digital-date="title.digitalDate"
        />
      </div>

      <!-- Overview and Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <!-- Main Description and Timeline (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Overview -->
          <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-3">
            <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
              <span>خلاصه داستان</span>
            </h3>
            <p class="text-sm text-slate-300 leading-relaxed font-normal">
              {{ title.overview || 'خلاصه داستانی برای این اثر به زبان فارسی ثبت نشده است.' }}
            </p>
          </div>

          <!-- Chronological Release Timeline -->
          <ReleaseTimeline
            :release-dates="title.releaseDates"
            :default-region="settingsStore.selectedRegion"
          />

          <!-- Watch Providers -->
          <WatchProviders
            :watch-providers="title.watchProviders"
            :default-region="settingsStore.selectedRegion"
          />

          <!-- TV Series Seasons and Episodes -->
          <SeasonList
            v-if="title.type === 'tv' && title.seasons"
            :seasons="title.seasons"
            :next-episode="title.nextEpisodeToAir"
            :last-episode="title.lastEpisodeToAir"
            :episodes="title.episodes"
          />

          <!-- Cast -->
          <CastList :cast="title.cast" />
        </div>

        <!-- Sidebar Meta Info (1 col) -->
        <div class="space-y-6">
          <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4 text-xs overflow-hidden">
            <h3 class="text-sm font-bold text-slate-100 pb-3 border-b border-slate-800">
              مشخصات اثر
            </h3>

            <!-- Genres -->
            <div class="space-y-1.5">
              <span class="text-slate-400 font-semibold block">ژانرها:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="g in title.genres"
                  :key="g.id"
                  class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {{ g.name }}
                </span>
              </div>
            </div>

            <!-- Countries -->
            <div class="space-y-1">
              <span class="text-slate-400 font-semibold block">کشور سازنده:</span>
              <span class="text-slate-200">
                {{ title.countries.map((c) => c.name).join('، ') || 'نامشخص' }}
              </span>
            </div>

            <!-- Languages -->
            <div class="space-y-1">
              <span class="text-slate-400 font-semibold block">زبان‌های اصلی:</span>
              <span class="text-slate-200">
                {{ title.languages.map((l) => l.name).join('، ') || 'نامشخص' }}
              </span>
            </div>

            <!-- Companies -->
            <div class="space-y-1.5">
              <span class="text-slate-400 font-semibold block">استودیوهای تولید:</span>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="comp in title.companies"
                  :key="comp.id"
                  class="text-slate-300"
                >
                  {{ comp.name }}
                </span>
              </div>
            </div>

            <!-- External IDs -->
            <div v-if="title.externalIds?.imdbId" class="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span class="text-slate-400">صفحه در IMDb:</span>
              <a
                :href="`https://www.imdb.com/title/${title.externalIds.imdbId}`"
                target="_blank"
                rel="noopener noreferrer"
                class="text-amber-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <span>مشاهده</span>
                <SvgIcon name="external-link" size="12" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add to List Modal Dialog -->
    <AddToListModal
      v-if="title"
      :show="showAddModal"
      :type="title.type"
      :id="title.id"
      :title="title.title || title.originalTitle"
      :poster-path="title.posterPath"
      @close="showAddModal = false"
    />
  </div>
</template>
