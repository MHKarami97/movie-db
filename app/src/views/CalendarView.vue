<script setup lang="ts">
import { onMounted } from 'vue';
import { useCalendarStore } from '../stores/calendarStore.js';
import MonthNavigation from '../components/calendar/MonthNavigation.vue';
import CalendarGrid from '../components/calendar/CalendarGrid.vue';
import WeekStrip from '../components/calendar/WeekStrip.vue';
import AgendaList from '../components/calendar/AgendaList.vue';

const calendarStore = useCalendarStore();

onMounted(() => {
  calendarStore.loadMonthData();
});
</script>

<template>
  <div class="space-y-6">
    <!-- Month Navigation Bar -->
    <MonthNavigation />

    <!-- Mobile Week Strip -->
    <WeekStrip />

    <!-- Desktop Jalali Month Grid -->
    <CalendarGrid />

    <!-- Daily Agenda / Selected Day Titles (mobile primary, desktop detail) -->
    <AgendaList />
  </div>
</template>
