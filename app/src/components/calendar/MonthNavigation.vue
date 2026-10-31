<script setup lang="ts">
import { useCalendarStore } from '../../stores/calendarStore.js';
import { useSettingsStore } from '../../stores/settingsStore.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import SvgIcon from '../common/SvgIcon.vue';

const calendarStore = useCalendarStore();
const settingsStore = useSettingsStore();

const regions = [
  { code: 'IR', label: 'ایران (IR)' },
  { code: 'US', label: 'آمریکا (US)' },
  { code: 'GB', label: 'بریتانیا (GB)' },
  { code: 'DE', label: 'آلمان (DE)' },
  { code: 'CA', label: 'کانادا (CA)' }
];
</script>

<template>
  <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
    <!-- Month Navigation Controls -->
    <div class="flex items-center justify-between md:justify-start gap-3">
      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="calendarStore.prevMonth()"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 text-slate-200 hover:bg-slate-700 transition"
          aria-label="ماه قبل"
          title="ماه قبل"
        >
          <SvgIcon name="chevron-right" size="18" />
        </button>

        <button
          type="button"
          @click="calendarStore.nextMonth()"
          class="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-800/60 text-slate-200 hover:bg-slate-700 transition"
          aria-label="ماه بعد"
          title="ماه بعد"
        >
          <SvgIcon name="chevron-left" size="18" />
        </button>
      </div>

      <div class="text-center md:text-start px-2">
        <h2 class="text-lg font-bold text-slate-100 flex items-center gap-2">
          <span>{{ calendarStore.currentMonthName }}</span>
          <span class="text-amber-400 font-extrabold">{{ PersianUtils.toPersianDigits(calendarStore.currentJy) }}</span>
        </h2>
      </div>

      <button
        type="button"
        @click="calendarStore.goToday()"
        class="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-slate-100 hover:border-slate-600 transition"
      >
        امروز
      </button>
    </div>

    <!-- Filters & Selectors -->
    <div class="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
      <!-- Media Type Segmented Tabs -->
      <div class="inline-flex rounded-xl p-1 bg-slate-950 border border-slate-800 text-xs">
        <button
          type="button"
          @click="calendarStore.mediaTypeFilter = 'all'"
          class="px-3 py-1.5 rounded-lg font-medium transition"
          :class="calendarStore.mediaTypeFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          همه
        </button>
        <button
          type="button"
          @click="calendarStore.mediaTypeFilter = 'movie'"
          class="px-3 py-1.5 rounded-lg font-medium transition"
          :class="calendarStore.mediaTypeFilter === 'movie' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          فیلم‌ها
        </button>
        <button
          type="button"
          @click="calendarStore.mediaTypeFilter = 'tv'"
          class="px-3 py-1.5 rounded-lg font-medium transition"
          :class="calendarStore.mediaTypeFilter === 'tv' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          سریال‌ها
        </button>
      </div>

      <!-- Region Selector -->
      <div class="relative inline-flex items-center">
        <select
          v-model="settingsStore.selectedRegion"
          @change="settingsStore.setRegion(settingsStore.selectedRegion)"
          class="appearance-none bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 pl-8 text-xs font-medium text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          aria-label="انتخاب منطقه اکران"
        >
          <option v-for="r in regions" :key="r.code" :value="r.code">
            {{ r.label }}
          </option>
        </select>
        <span class="pointer-events-none absolute left-2.5 text-slate-500">
          <SvgIcon name="chevron-down" size="14" />
        </span>
      </div>
    </div>
  </div>
</template>
