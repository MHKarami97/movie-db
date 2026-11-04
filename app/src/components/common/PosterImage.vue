<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import SvgIcon from './SvgIcon.vue';

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 800;

const props = withDefaults(
  defineProps<{
    src: string;
    alt: string;
    placeholderIcon?: 'film' | 'user';
    iconSize?: number;
    eager?: boolean;
    imgClass?: string;
  }>(),
  { placeholderIcon: 'film', iconSize: 32, eager: false, imgClass: '' }
);

const loaded = ref(false);
const failed = ref(false);
const attempt = ref(0);
let retryTimer: ReturnType<typeof setTimeout> | undefined;

const effectiveSrc = computed(() => {
  if (!props.src || attempt.value === 0) return props.src;
  const separator = props.src.includes('?') ? '&' : '?';
  return `${props.src}${separator}r=${attempt.value}`;
});

function clearRetryTimer(): void {
  if (retryTimer !== undefined) {
    clearTimeout(retryTimer);
    retryTimer = undefined;
  }
}

function handleError(): void {
  if (attempt.value >= MAX_RETRIES) {
    failed.value = true;
    return;
  }
  const delay = RETRY_BASE_DELAY_MS * 2 ** attempt.value;
  clearRetryTimer();
  retryTimer = setTimeout(() => {
    attempt.value += 1;
  }, delay);
}

watch(
  () => props.src,
  () => {
    clearRetryTimer();
    loaded.value = false;
    failed.value = false;
    attempt.value = 0;
  }
);

onBeforeUnmount(clearRetryTimer);
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-slate-800">
    <div
      class="absolute inset-0 flex items-center justify-center text-slate-600"
      :class="{ 'animate-pulse': src && !loaded && !failed }"
      aria-hidden="true"
    >
      <SvgIcon :name="placeholderIcon" :size="iconSize" />
    </div>

    <img
      v-if="src && !failed"
      :key="effectiveSrc"
      :src="effectiveSrc"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
      :class="[loaded ? 'opacity-100' : 'opacity-0', imgClass]"
      @load="loaded = true"
      @error="handleError"
    />
  </div>
</template>
