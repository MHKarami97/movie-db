<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useCalendarFilterStore } from '../../stores/calendarFilterStore.js';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useFilterStore } from '../../stores/filterStore.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import SvgIcon from '../common/SvgIcon.vue';

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const filterStore = useCalendarFilterStore();
const calendarStore = useCalendarStore();
const catalogStore = useFilterStore();

const releaseTypes = [
  { key: 'theatrical', label: 'اکران سینما' },
  { key: 'digital', label: 'انتشار دیجیتال' },
  { key: 'physical', label: 'دیسک / فیزیکی' },
  { key: 'premiere', label: 'افتتاحیه' },
  { key: 'tv', label: 'پخش تلویزیونی' }
];
const voteSteps = [0, 10, 50, 100, 500, 1000];
const selectClass =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500';

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.open) emit('close');
}

watch(
  () => props.open,
  (isOpen) => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) catalogStore.loadFacets();
  }
);

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  document.body.style.overflow = '';
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="flex w-full max-h-[92vh] flex-col rounded-t-3xl border border-slate-800 bg-slate-900 sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-label="فیلتر تقویم"
      >
        <div class="flex items-center justify-between border-b border-slate-800 p-4">
          <div class="flex items-center gap-2">
            <SvgIcon name="filter" size="18" class-name="text-amber-400" />
            <h3 class="text-base font-bold text-slate-100">فیلتر تقویم</h3>
          </div>
          <button
            type="button"
            @click="emit('close')"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="بستن"
          >
            <SvgIcon name="close" size="18" />
          </button>
        </div>

        <div class="flex-1 space-y-5 overflow-y-auto p-4">
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400">ژانر (هرکدام از موارد انتخابی)</label>
            <div class="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto p-0.5">
              <button
                v-for="genre in catalogStore.dictionaries.genres"
                :key="genre.id"
                type="button"
                @click="filterStore.toggleGenre(genre.id)"
                class="rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
                :class="
                  filterStore.filters.genres.includes(genre.id)
                    ? 'border-amber-500 bg-amber-500 font-bold text-slate-950'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                "
              >
                {{ genre.name }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400" for="cal-filter-language">زبان</label>
            <select id="cal-filter-language" v-model="filterStore.filters.language" :class="selectClass">
              <option value="">همه زبان‌ها</option>
              <option v-for="l in catalogStore.dictionaries.languages" :key="l.code" :value="l.code">{{ l.name }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400" for="cal-filter-country">کشور سازنده</label>
            <select id="cal-filter-country" v-model="filterStore.filters.country" :class="selectClass">
              <option value="">همه کشورها</option>
              <option v-for="c in catalogStore.dictionaries.countries" :key="c.code" :value="c.code">{{ c.name }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400" for="cal-filter-provider">پلتفرم پخش</label>
            <select id="cal-filter-provider" v-model="filterStore.filters.providerId" :class="selectClass">
              <option :value="null">همه پلتفرم‌ها</option>
              <option v-for="p in catalogStore.dictionaries.providers" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400" for="cal-filter-release">نوع انتشار</label>
            <select id="cal-filter-release" v-model="filterStore.filters.releaseType" :class="selectClass">
              <option value="">همه انواع</option>
              <option v-for="t in releaseTypes" :key="t.key" :value="t.key">{{ t.label }}</option>
            </select>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold">
              <label class="text-slate-400" for="cal-filter-rating">حداقل امتیاز</label>
              <span class="text-amber-400">{{ PersianUtils.toPersianDigits(filterStore.filters.minRating) }}</span>
            </div>
            <input
              id="cal-filter-rating"
              v-model.number="filterStore.filters.minRating"
              type="range"
              min="0"
              max="9"
              step="0.5"
              class="w-full cursor-pointer accent-amber-500"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-400" for="cal-filter-votes">حداقل تعداد رأی</label>
            <select id="cal-filter-votes" v-model.number="filterStore.filters.minVotes" :class="selectClass">
              <option v-for="v in voteSteps" :key="v" :value="v">
                {{ v === 0 ? 'بدون محدودیت' : PersianUtils.toPersianDigits(v) + '+' }}
              </option>
            </select>
          </div>

          <label class="flex cursor-pointer items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <span class="text-xs font-semibold text-slate-200">فقط دارای تریلر</span>
            <input v-model="filterStore.filters.hasTrailer" type="checkbox" class="h-4 w-4 rounded accent-amber-500" />
          </label>
        </div>

        <div class="flex gap-3 border-t border-slate-800 p-4">
          <button
            type="button"
            @click="filterStore.reset()"
            :disabled="!filterStore.hasActiveFilters"
            class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
          >
            <SvgIcon name="reset" size="14" />
            <span>ریست فیلتر</span>
          </button>
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-600"
          >
            نمایش {{ PersianUtils.toPersianDigits(calendarStore.visibleItems.length) }} عنوان
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
