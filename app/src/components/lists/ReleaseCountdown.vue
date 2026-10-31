<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { MediaType } from '../../types/index.js';
import { ReleaseDateResolver, ReleaseInfo } from '../../services/ReleaseDateResolver.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import { useNowTicker } from '../../composables/useNowTicker.js';
import SvgIcon from '../common/SvgIcon.vue';

const props = defineProps<{ type: MediaType; id: number }>();

const resolver = new ReleaseDateResolver();
const info = ref<ReleaseInfo | null>(null);
const now = useNowTicker();

onMounted(async () => {
  info.value = await resolver.resolve(props.type, props.id);
});

const text = computed<string>(() => {
  if (!info.value) return '';
  if (!info.value.found) return '';
  if (!info.value.nextDate) return 'منتشر شده یا تاریخ مشخص نیست';

  const target = new Date(`${info.value.nextDate}T00:00:00Z`).getTime();
  const diffMs = target - now.value;
  if (diffMs <= 0) return 'امروز منتشر می‌شود';

  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${PersianUtils.toPersianDigits(days)} روز`);
  if (days < 30 && (hours > 0 || days === 0)) parts.push(`${PersianUtils.toPersianDigits(hours)} ساعت`);
  if (days === 0) parts.push(`${PersianUtils.toPersianDigits(minutes)} دقیقه`);

  return `${parts.join(' و ')} تا اکران`;
});
</script>

<template>
  <div v-if="text" class="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-400/90">
    <SvgIcon name="clock" size="12" />
    <span>{{ text }}</span>
  </div>
</template>
