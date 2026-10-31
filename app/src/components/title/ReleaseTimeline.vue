<script setup lang="ts">
import { ref, computed } from 'vue';
import { RegionReleaseDates } from '../../types/index.js';
import { JalaliDateService } from '../../services/JalaliDateService.js';

const props = defineProps<{
  releaseDates: Record<string, RegionReleaseDates>;
  defaultRegion?: string;
}>();

const dateService = new JalaliDateService();
const activeRegion = ref<string>(props.defaultRegion || 'US');

const availableRegions = computed(() => Object.keys(props.releaseDates));

const activeDates = computed<RegionReleaseDates>(() => {
  return props.releaseDates[activeRegion.value] || {};
});

const timelineSteps = computed(() => {
  const d = activeDates.value;
  const steps: Array<{ key: string; label: string; date: string; jalali: string }> = [];

  if (d.premiere) {
    steps.push({
      key: 'premiere',
      label: 'افتتاحیه و جشنواره‌ها',
      date: d.premiere,
      jalali: dateService.formatJalali(d.premiere)
    });
  }
  if (d.theatricalLimited) {
    steps.push({
      key: 'theatricalLimited',
      label: 'اکران محدود سینما',
      date: d.theatricalLimited,
      jalali: dateService.formatJalali(d.theatricalLimited)
    });
  }
  if (d.theatrical) {
    steps.push({
      key: 'theatrical',
      label: 'اکران سراسری سینما',
      date: d.theatrical,
      jalali: dateService.formatJalali(d.theatrical)
    });
  }
  if (d.digital) {
    steps.push({
      key: 'digital',
      label: 'انتشار نسخه دیجیتال (VOD)',
      date: d.digital,
      jalali: dateService.formatJalali(d.digital)
    });
  }
  if (d.physical) {
    steps.push({
      key: 'physical',
      label: 'انتشار دیسک و فیزیکی (Blu-ray)',
      date: d.physical,
      jalali: dateService.formatJalali(d.physical)
    });
  }
  if (d.tv) {
    steps.push({
      key: 'tv',
      label: 'پخش تلویزیونی',
      date: d.tv,
      jalali: dateService.formatJalali(d.tv)
    });
  }

  // Sort by date ascending
  return steps.sort((a, b) => a.date.localeCompare(b.date));
});
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4 overflow-hidden">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-amber-400 shrink-0"></span>
        <span>خط زمان انتشار و اکران</span>
      </h3>

      <!-- Region Switcher -->
      <div v-if="availableRegions.length > 1" class="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-fit max-w-full">
        <button
          v-for="reg in availableRegions"
          :key="reg"
          type="button"
          @click="activeRegion = reg"
          class="px-2.5 py-1 rounded-lg font-medium transition shrink-0"
          :class="activeRegion === reg ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          {{ reg }}
        </button>
      </div>
    </div>

    <!-- Timeline List -->
    <div v-if="timelineSteps.length > 0" class="relative border-r-2 border-slate-800 space-y-5 my-3 mr-2 sm:mr-3">
      <div
        v-for="step in timelineSteps"
        :key="step.key"
        class="relative pr-5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 group"
      >
        <!-- Circle Marker centered on line -->
        <span class="absolute -right-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-amber-400 group-hover:scale-125 transition"></span>

        <div>
          <span class="text-sm font-bold text-slate-200 block">{{ step.label }}</span>
          <span class="text-xs text-slate-400 font-mono dir-ltr text-right inline-block">
            {{ step.date }}
          </span>
        </div>

        <div class="text-xs font-semibold text-amber-400/90 sm:text-left">
          {{ step.jalali }}
        </div>
      </div>
    </div>

    <div v-else class="text-xs text-slate-400 py-3 text-center">
      تاریخ اکران دقیقی برای منطقه {{ activeRegion }} ثبت نشده است.
    </div>
  </div>
</template>
