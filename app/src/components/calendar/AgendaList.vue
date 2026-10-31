<script setup lang="ts">
import { computed } from 'vue';
import { useCalendarStore } from '../../stores/calendarStore.js';
import { WorkerClient } from '../../services/WorkerClient.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import { JalaliDateService } from '../../services/JalaliDateService.js';
import SvgIcon from '../common/SvgIcon.vue';
import EmptyState from '../common/EmptyState.vue';

const calendarStore = useCalendarStore();
const workerClient = new WorkerClient();
const dateService = new JalaliDateService();

const selectedDateLabel = computed(() => {
  if (!calendarStore.selectedDayCell) return '';
  return dateService.formatJalali(calendarStore.selectedDayCell.dateIso);
});

function getPoster(path: string | null): string {
  return workerClient.getImageUrl('w185', path);
}

function getReleaseTypeLabel(type: string): string {
  switch (type) {
    case 'theatrical':
      return 'سینمایی';
    case 'digital':
      return 'دیجیتال';
    case 'physical':
      return 'بلوری / فیزیکی';
    case 'premiere':
      return 'افتتاحیه';
    case 'tv':
      return 'پخش تلویزیونی';
    default:
      return type;
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Header of selected day -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
        <h3 class="text-sm font-bold text-slate-100">
          عناوین منتشر شده در {{ selectedDateLabel }}
        </h3>
      </div>
      <span class="text-xs text-slate-400 font-mono">
        {{ PersianUtils.toPersianDigits(calendarStore.selectedDayItems.length) }} عنوان
      </span>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-if="calendarStore.selectedDayItems.length === 0"
      icon="calendar"
      title="عنوانی برای این روز ثبت نشده است"
      description="می‌توانید روزهای دارای نشانگر زرد رنگ را انتخاب کنید یا به ماه‌های آینده بروید."
    />

    <!-- Titles Grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      <router-link
        v-for="item in calendarStore.selectedDayItems"
        :key="item.type + '-' + item.id"
        :to="`/title/${item.type}/${item.id}`"
        class="group flex gap-3.5 p-3 rounded-2xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition"
      >
        <!-- Poster Thumbnail with fixed aspect ratio to prevent layout shift -->
        <div class="relative w-20 shrink-0 aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-slate-800">
          <img
            v-if="item.posterPath"
            :src="getPoster(item.posterPath)"
            :alt="item.title"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            width="80"
            height="120"
            class="h-full w-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-slate-600">
            <SvgIcon name="calendar" size="24" />
          </div>
        </div>

        <!-- Info Column -->
        <div class="flex flex-col justify-between flex-1 min-w-0 py-0.5">
          <div class="space-y-1.5">
            <div class="flex items-center gap-1.5">
              <span
                class="px-2 py-0.5 rounded-md text-[10px] font-bold"
                :class="item.type === 'movie' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'"
              >
                {{ item.type === 'movie' ? 'فیلم' : 'سریال' }}
              </span>
              <span
                v-for="relType in item.releaseTypes"
                :key="relType"
                class="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700"
              >
                {{ getReleaseTypeLabel(relType) }}
              </span>
            </div>

            <h4 class="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition truncate">
              {{ item.title }}
            </h4>
            <p v-if="item.originalTitle !== item.title" class="text-xs text-slate-400 truncate dir-ltr text-right">
              {{ item.originalTitle }}
            </p>
          </div>

          <!-- Bottom Rating -->
          <div class="flex items-center gap-1 text-xs text-amber-400 font-semibold pt-2">
            <SvgIcon name="star" size="14" className="text-amber-400 fill-amber-400" />
            <span>{{ PersianUtils.toPersianDigits(item.rating) }}</span>
            <span class="text-[10px] text-slate-500 font-normal">({{ PersianUtils.toPersianDigits(item.voteCount) }})</span>
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>
