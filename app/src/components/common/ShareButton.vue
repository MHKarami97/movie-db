<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { MediaType } from '../../types/index.js';
import { ShareService, ShareOutcome } from '../../services/ShareService.js';
import SvgIcon from './SvgIcon.vue';

const props = withDefaults(
  defineProps<{ type: MediaType; id: number; title: string; compact?: boolean }>(),
  { compact: false }
);

const shareService = new ShareService();
const outcome = ref<ShareOutcome | null>(null);
let resetTimer: number | null = null;

async function handleShare(): Promise<void> {
  outcome.value = await shareService.shareTitle(props.type, props.id, props.title);
  if (resetTimer !== null) window.clearTimeout(resetTimer);
  resetTimer = window.setTimeout(() => (outcome.value = null), 2500);
}

function label(): string {
  if (outcome.value === 'copied') return 'لینک کپی شد';
  if (outcome.value === 'failed') return 'خطا در اشتراک';
  return 'اشتراک‌گذاری';
}

onUnmounted(() => {
  if (resetTimer !== null) window.clearTimeout(resetTimer);
});
</script>

<template>
  <button
    type="button"
    @click.stop.prevent="handleShare"
    class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-200 text-xs font-bold transition hover:bg-slate-800"
    :class="compact ? 'h-9 w-9' : 'px-3.5 py-2 sm:px-4 sm:py-2.5'"
    :title="label()"
    :aria-label="label()"
  >
    <SvgIcon :name="outcome === 'copied' ? 'check' : 'share'" size="16" :class-name="outcome === 'copied' ? 'text-emerald-400' : ''" />
    <span v-if="!compact">{{ label() }}</span>
  </button>
</template>
