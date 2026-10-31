<script setup lang="ts">
import { useFilterStore } from '../../stores/filterStore.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import SvgIcon from '../common/SvgIcon.vue';

defineProps<{
  open: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const filterStore = useFilterStore();

function toggleGenre(genreId: number) {
  const idx = filterStore.selectedGenres.indexOf(genreId);
  if (idx >= 0) {
    filterStore.selectedGenres.splice(idx, 1);
  } else {
    filterStore.selectedGenres.push(genreId);
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
    @click.self="$emit('close')"
  >
    <div class="w-full max-w-md h-full bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <SvgIcon name="filter" size="18" className="text-amber-400" />
            <h3 class="text-base font-bold text-slate-100">فیلترهای پیشرفته</h3>
          </div>
          <button
            type="button"
            @click="$emit('close')"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <SvgIcon name="close" size="18" />
          </button>
        </div>

        <!-- Cinema vs Online Special Toggle -->
        <div class="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-xs font-bold text-amber-300">در حال اکران سینما (هنوز آنلاین نشده)</span>
            <input
              type="checkbox"
              v-model="filterStore.inCinemaNotOnline"
              class="h-4 w-4 rounded accent-amber-500"
            />
          </label>
          <p class="text-[11px] text-slate-400 leading-relaxed">
            عناوینی که اکران سینمایی آن‌ها آغاز شده اما هنوز روی پلتفرم‌های دیجیتال منتشر نشده‌اند.
          </p>
        </div>

        <!-- Has Trailer Toggle -->
        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
          <span class="text-xs font-semibold text-slate-200">فقط عناوین دارای تریلر رسمی</span>
          <input
            type="checkbox"
            v-model="filterStore.hasTrailer"
            class="h-4 w-4 rounded accent-amber-500"
          />
        </div>

        <!-- Media Type -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 block">نوع اثر:</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in [{ key: 'all', label: 'همه' }, { key: 'movie', label: 'فیلم' }, { key: 'tv', label: 'سریال' }]"
              :key="opt.key"
              type="button"
              @click="filterStore.typeFilter = opt.key as any"
              class="py-2 rounded-xl text-xs font-semibold transition border"
              :class="filterStore.typeFilter === opt.key ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Minimum Rating Slider -->
        <div class="space-y-2">
          <div class="flex items-center justify-between text-xs font-bold">
            <span class="text-slate-400">حداقل امتیاز TMDB:</span>
            <span class="text-amber-400">{{ PersianUtils.toPersianDigits(filterStore.minRating) }} از ۱۰</span>
          </div>
          <input
            type="range"
            min="0"
            max="9"
            step="0.5"
            v-model.number="filterStore.minRating"
            class="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <!-- Genres Chips -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 block">ژانرها:</label>
          <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
            <button
              v-for="genre in filterStore.dictionaries.genres"
              :key="genre.id"
              type="button"
              @click="toggleGenre(genre.id)"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition border"
              :class="filterStore.selectedGenres.includes(genre.id) ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
            >
              {{ genre.name }}
            </button>
          </div>
        </div>

        <!-- Streaming Providers Select -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 block">پلتفرم استریم:</label>
          <select
            v-model="filterStore.selectedProvider"
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option :value="null">همه پلتفرم‌ها</option>
            <option
              v-for="p in filterStore.dictionaries.providers"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Footer Buttons -->
      <div class="pt-6 border-t border-slate-800 flex gap-3">
        <button
          type="button"
          @click="filterStore.resetFilters()"
          class="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
        >
          پاک کردن فیلترها
        </button>
        <button
          type="button"
          @click="$emit('close')"
          class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition"
        >
          اعمال و مشاهده ({{ PersianUtils.toPersianDigits(filterStore.filteredTitles.length) }})
        </button>
      </div>
    </div>
  </div>
</template>
