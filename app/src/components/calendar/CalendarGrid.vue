<script setup lang="ts">
import { useCalendarStore } from '../../stores/calendarStore.js';
import { CalendarDayCell } from '../../services/interfaces.js';
import { JALALI_WEEK_DAYS } from '../../services/JalaliDateService.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import { CalendarItem } from '../../types/index.js';

const calendarStore = useCalendarStore();

function getDayItems(isoDate: string): CalendarItem[] {
  return calendarStore.itemsByDate.get(isoDate) || [];
}

function selectDay(cell: CalendarDayCell) {
  calendarStore.selectDay(cell);
}
</script>

<template>
  <div class="hidden md:block rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden shadow-xl">
    <!-- Weekday Header Row -->
    <div class="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-center text-xs font-bold text-slate-400">
      <div
        v-for="(day, idx) in JALALI_WEEK_DAYS"
        :key="day.key"
        class="py-3"
        :class="idx === 6 ? 'text-rose-400/90 font-extrabold' : ''"
      >
        {{ day.name }}
      </div>
    </div>

    <!-- Day Cells Grid (7 columns) -->
    <div class="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-x-reverse divide-slate-800/80">
      <div
        v-for="cell in calendarStore.gridCells"
        :key="cell.dateIso + '-' + cell.jDay"
        @click="selectDay(cell)"
        class="min-h-[120px] p-2 flex flex-col justify-between transition group cursor-pointer relative"
        :class="[
          cell.isCurrentMonth ? 'bg-slate-900/20 hover:bg-slate-800/40' : 'bg-slate-950/40 opacity-40 hover:opacity-60',
          cell.isToday ? 'ring-2 ring-inset ring-amber-500/80 bg-amber-500/5' : '',
          calendarStore.selectedDayCell?.dateIso === cell.dateIso ? 'border-amber-400' : ''
        ]"
      >
        <!-- Cell Top: Day Number and Badges -->
        <div class="flex items-center justify-between">
          <span
            class="text-xs font-bold rounded-md px-1.5 py-0.5"
            :class="[
              cell.isToday
                ? 'bg-amber-500 text-slate-950 font-black'
                : cell.isFriday
                ? 'text-rose-400'
                : 'text-slate-300'
            ]"
          >
            {{ cell.persianDayText }}
          </span>

          <span
            v-if="getDayItems(cell.dateIso).length > 0"
            class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono"
          >
            {{ PersianUtils.toPersianDigits(getDayItems(cell.dateIso).length) }}
          </span>
        </div>

        <!-- Cell Body: Titles Snippets (up to 3) -->
        <div class="my-1.5 space-y-1 overflow-hidden flex-1">
          <router-link
            v-for="item in getDayItems(cell.dateIso).slice(0, 3)"
            :key="item.type + '-' + item.id"
            :to="`/title/${item.type}/${item.id}`"
            class="block px-2 py-1 rounded-md text-[11px] truncate transition border border-transparent hover:border-slate-700"
            :class="[
              item.type === 'movie'
                ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
            ]"
            :title="item.title"
            @click.stop
          >
            <span class="font-medium">{{ item.title }}</span>
          </router-link>

          <div
            v-if="getDayItems(cell.dateIso).length > 3"
            class="text-[10px] text-slate-400 pr-1"
          >
            + {{ PersianUtils.toPersianDigits(getDayItems(cell.dateIso).length - 3) }} عنوان دیگر
          </div>
        </div>

        <!-- Cell Bottom Dot indicator -->
        <div v-if="getDayItems(cell.dateIso).length > 0" class="flex gap-1 justify-end">
          <span
            v-for="item in getDayItems(cell.dateIso).slice(0, 4)"
            :key="'dot-' + item.id"
            class="h-1 w-1 rounded-full"
            :class="item.type === 'movie' ? 'bg-amber-400' : 'bg-cyan-400'"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>
