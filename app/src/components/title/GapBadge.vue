<script setup lang="ts">
import { PersianUtils } from '../../services/PersianUtils.js';
import SvgIcon from '../common/SvgIcon.vue';

defineProps<{
  gapDays: number | null;
  theatricalDate?: string | null;
  digitalDate?: string | null;
}>();
</script>

<template>
  <div
    v-if="gapDays !== null"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold"
    :class="[
      gapDays <= 45
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : gapDays <= 90
        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
    ]"
  >
    <SvgIcon name="clock" size="14" />
    <span>فاصله اکران سینما تا پخش دیجیتال:</span>
    <span class="font-bold underline decoration-dotted">
      {{ PersianUtils.formatGapDays(gapDays) }}
    </span>
  </div>
</template>
