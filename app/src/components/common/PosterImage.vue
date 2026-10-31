<script setup lang="ts">
import { ref, watch } from 'vue';
import SvgIcon from './SvgIcon.vue';

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

watch(
  () => props.src,
  () => {
    loaded.value = false;
    failed.value = false;
  }
);
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
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      referrerpolicy="no-referrer"
      class="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
      :class="[loaded ? 'opacity-100' : 'opacity-0', imgClass]"
      @load="loaded = true"
      @error="failed = true"
    />
  </div>
</template>
