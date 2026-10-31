<script setup lang="ts">
import SvgIcon from './SvgIcon.vue';

defineProps<{
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
}>();

defineEmits<{
  (e: 'action'): void;
}>();
</script>

<template>
  <div class="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-400 mb-4">
      <SvgIcon :name="icon || 'info'" size="28" />
    </div>
    <h4 class="text-base font-bold text-slate-200 mb-1">{{ title }}</h4>
    <p v-if="description" class="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
      {{ description }}
    </p>
    <button
      v-if="actionText"
      type="button"
      @click="$emit('action')"
      class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs transition"
    >
      {{ actionText }}
    </button>
  </div>
</template>
