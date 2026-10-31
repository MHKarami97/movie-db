<script setup lang="ts">
import { onMounted } from 'vue';
import { useCalendarStore } from '../stores/calendarStore.js';
import MonthNavigation from '../components/calendar/MonthNavigation.vue';
import CalendarGrid from '../components/calendar/CalendarGrid.vue';
import MobileMonthGrid from '../components/calendar/MobileMonthGrid.vue';
import AgendaList from '../components/calendar/AgendaList.vue';

const calendarStore = useCalendarStore();

onMounted(() => {
  calendarStore.loadMonthData();
});
</script>

<template>
  <div class="space-y-6">
    <MonthNavigation />
    <MobileMonthGrid />
    <CalendarGrid />
    <AgendaList />
  </div>
</template>
