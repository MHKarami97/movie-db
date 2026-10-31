import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { JalaliDateService } from '../services/JalaliDateService.js';
import { DataRepository } from '../services/DataRepository.js';
import { CalendarDayCell } from '../services/interfaces.js';
import { CalendarItem } from '../types/index.js';
import { BayesianRatingScorer, IRatingScorer } from '../services/RatingScorer.js';
import { useCalendarFilterStore } from './calendarFilterStore.js';

export const useCalendarStore = defineStore('calendar', () => {
  const dateService = new JalaliDateService();
  const dataRepo = new DataRepository();
  const ratingScorer: IRatingScorer = new BayesianRatingScorer();
  const filterStore = useCalendarFilterStore();

  const todayJalali = dateService.toJalaali(new Date());
  const currentJy = ref<number>(todayJalali.jy);
  const currentJm = ref<number>(todayJalali.jm);
  const selectedDayCell = ref<CalendarDayCell | null>(null);

  const items = ref<CalendarItem[]>([]);
  const loading = ref<boolean>(false);

  // Month grid of days
  const gridCells = computed<CalendarDayCell[]>(() => {
    return dateService.getMonthGrid(currentJy.value, currentJm.value);
  });

  // Current month name
  const currentMonthName = computed<string>(() => {
    return dateService.getMonthName(currentJm.value);
  });

  const priorMean = computed<number>(() => ratingScorer.estimatePriorMean(items.value));

  const visibleItems = computed<CalendarItem[]>(() => items.value.filter((item) => filterStore.matches(item)));

  // Items grouped by ISO date (YYYY-MM-DD); each day sorted by weighted rating, descending
  const itemsByDate = computed<Map<string, CalendarItem[]>>(() => {
    const grouped = new Map<string, CalendarItem[]>();
    for (const item of visibleItems.value) {
      const bucket = grouped.get(item.date);
      if (bucket) bucket.push(item);
      else grouped.set(item.date, [item]);
    }

    for (const [date, bucket] of grouped) {
      grouped.set(date, ratingScorer.sortDescending(bucket, priorMean.value));
    }
    return grouped;
  });

  // Selected day items
  const selectedDayItems = computed<CalendarItem[]>(() => {
    if (!selectedDayCell.value) return [];
    return itemsByDate.value.get(selectedDayCell.value.dateIso) || [];
  });

  async function loadMonthData() {
    loading.value = true;
    try {
      // Jalali month spans across 2 Gregorian months
      // Determine Gregorian range for 1st and last day of this Jalali month
      const daysCount = gridCells.value.filter((c) => c.isCurrentMonth).length;
      const gFirst = dateService.toGregorian(currentJy.value, currentJm.value, 1);
      const gLast = dateService.toGregorian(currentJy.value, currentJm.value, daysCount);

      const m1Key = `${gFirst.gy}-${String(gFirst.gm).padStart(2, '0')}`;
      const m2Key = `${gLast.gy}-${String(gLast.gm).padStart(2, '0')}`;

      const [items1, items2] = await Promise.all([
        dataRepo.getCalendarMonth(m1Key),
        m1Key !== m2Key ? dataRepo.getCalendarMonth(m2Key) : Promise.resolve([])
      ]);

      // Deduplicate items by type and id and date
      const map = new Map<string, CalendarItem>();
      for (const item of [...items1, ...items2]) {
        map.set(`${item.type}-${item.id}-${item.date}`, item);
      }
      items.value = Array.from(map.values());

      // Set default selected day to today if in this month, otherwise 1st day of month
      const todayCell = gridCells.value.find((c) => c.isToday && c.isCurrentMonth);
      const firstCurrentCell = gridCells.value.find((c) => c.isCurrentMonth);
      selectedDayCell.value = todayCell || firstCurrentCell || null;
    } finally {
      loading.value = false;
    }
  }

  function nextMonth() {
    if (currentJm.value === 12) {
      currentJy.value++;
      currentJm.value = 1;
    } else {
      currentJm.value++;
    }
    loadMonthData();
  }

  function prevMonth() {
    if (currentJm.value === 1) {
      currentJy.value--;
      currentJm.value = 12;
    } else {
      currentJm.value--;
    }
    loadMonthData();
  }

  function goToday() {
    const today = dateService.toJalaali(new Date());
    currentJy.value = today.jy;
    currentJm.value = today.jm;
    loadMonthData();
  }

  function selectDay(cell: CalendarDayCell) {
    selectedDayCell.value = cell;
  }

  return {
    currentJy,
    currentJm,
    currentMonthName,
    visibleItems,
    gridCells,
    items,
    itemsByDate,
    selectedDayCell,
    selectedDayItems,
    loading,
    loadMonthData,
    nextMonth,
    prevMonth,
    goToday,
    selectDay
  };
});
