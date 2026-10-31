<script setup lang="ts">
import { useCalendarStore } from '../../stores/calendarStore.js';
import { JALALI_WEEK_DAYS } from '../../services/JalaliDateService.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import { CalendarDayCell } from '../../services/interfaces.js';

const calendarStore = useCalendarStore();

function countOf(isoDate: string): number {
  return calendarStore.itemsByDate.get(isoDate)?.length ?? 0;
}

function isSelected(cell: CalendarDayCell): boolean {
  return calendarStore.selectedDayCell?.dateIso === cell.dateIso;
}
</script>

<template>
  <section class="md:hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-2" aria-label="روزهای ماه">
    <div class="grid grid-cols-7 gap-1 pb-1 text-center text-[10px] font-bold text-slate-400">
      <span v-for="(day, idx) in JALALI_WEEK_DAYS" :key="day.key" :class="idx === 6 ? 'text-rose-400' : ''">
        {{ day.short }}
      </span>
    </div>

    <div class="grid grid-cols-7 gap-1">
      <template v-for="cell in calendarStore.gridCells" :key="cell.dateIso">
        <span v-if="!cell.isCurrentMonth" aria-hidden="true"></span>

        <button
          v-else
          type="button"
          @click="calendarStore.selectDay(cell)"
          class="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl text-center transition"
          :class="[
            isSelected(cell)
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : cell.isToday
              ? 'border border-amber-500/50 bg-amber-500/10 text-amber-300'
              : cell.isFriday
              ? 'text-rose-400 hover:bg-slate-800/60'
              : 'text-slate-300 hover:bg-slate-800/60'
          ]"
          :aria-pressed="isSelected(cell)"
        >
          <span class="text-xs font-bold">{{ cell.persianDayText }}</span>
          <span
            v-if="countOf(cell.dateIso) > 0"
            class="rounded-full px-1.5 text-[9px] font-mono leading-4"
            :class="isSelected(cell) ? 'bg-slate-950/80 text-amber-300' : 'bg-slate-800 text-amber-400'"
          >
            {{ PersianUtils.toPersianDigits(countOf(cell.dateIso)) }}
          </span>
          <span v-else class="h-4"></span>
        </button>
      </template>
    </div>
  </section>
</template>
