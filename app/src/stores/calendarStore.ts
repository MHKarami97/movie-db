import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { JalaliDateService } from '../services/JalaliDateService.js';
import { DataRepository } from '../services/DataRepository.js';
import { CalendarDayCell } from '../services/interfaces.js';
import { CalendarItem, MediaType } from '../types/index.js';

export const useCalendarStore = defineStore('calendar', () => {
  const dateService = new JalaliDateService();
  const dataRepo = new DataRepository();

  const todayJalali = dateService.toJalaali(new Date());
  const currentJy = ref<number>(todayJalali.jy);
  const currentJm = ref<number>(todayJalali.jm);
  const selectedDayCell = ref<CalendarDayCell | null>(null);

  const mediaTypeFilter = ref<'all' | MediaType>('all');
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

  // Items grouped by ISO date string (YYYY-MM-DD)
  const itemsByDate = computed<Map<string, CalendarItem[]>>(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items.value) {
      if (mediaTypeFilter.value !== 'all' && item.type !== mediaTypeFilter.value) {
        continue;
      }
      if (!map.has(item.date)) {
        map.set(item.date, []);
      }
      map.get(item.date)!.push(item);
    }
    return map;
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
    mediaTypeFilter,
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
