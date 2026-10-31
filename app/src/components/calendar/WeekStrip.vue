<script setup lang="ts">
import { computed } from 'vue';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import { JALALI_WEEK_DAYS } from '../../services/JalaliDateService.js';
import { CalendarDayCell } from '../../services/interfaces.js';

const calendarStore = useCalendarStore();

// Find the current week slice around selected or today
const weekSlice = computed<CalendarDayCell[]>(() => {
  const cells = calendarStore.gridCells;
  if (cells.length === 0) return [];

  const selectedIso = calendarStore.selectedDayCell?.dateIso;
  const idx = cells.findIndex((c) => c.dateIso === selectedIso);
  const targetIndex = idx >= 0 ? idx : 0;

  // Find start of week (closest previous Saturday index, which is multiple of 7)
  const weekStartIdx = Math.floor(targetIndex / 7) * 7;
  return cells.slice(weekStartIdx, weekStartIdx + 7);
});

function getDayItemsCount(isoDate: string): number {
  return (calendarStore.itemsByDate.get(isoDate) || []).length;
}

function selectDay(cell: CalendarDayCell) {
  calendarStore.selectDay(cell);
}
</script>

<template>
  <div class="md:hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-2">
    <div class="grid grid-cols-7 gap-1">
      <button
        v-for="(cell, i) in weekSlice"
        :key="cell.dateIso"
        type="button"
        @click="selectDay(cell)"
        class="flex flex-col items-center justify-between py-2 rounded-xl transition min-h-[56px] text-center"
        :class="[
          calendarStore.selectedDayCell?.dateIso === cell.dateIso
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
            : cell.isToday
            ? 'border border-amber-500/50 bg-amber-500/10 text-amber-300'
            : 'text-slate-300 hover:bg-slate-800/60',
          !cell.isCurrentMonth ? 'opacity-40' : ''
        ]"
      >
        <span class="text-[10px] leading-tight opacity-75">
          {{ JALALI_WEEK_DAYS[i % 7]?.short }}
        </span>
        <span class="text-xs font-bold my-0.5">
          {{ cell.persianDayText }}
        </span>
        <span
          v-if="getDayItemsCount(cell.dateIso) > 0"
          class="h-1.5 w-1.5 rounded-full"
          :class="calendarStore.selectedDayCell?.dateIso === cell.dateIso ? 'bg-slate-950' : 'bg-amber-400'"
        ></span>
        <span v-else class="h-1.5 w-1.5"></span>
      </button>
    </div>
  </div>
</template>
