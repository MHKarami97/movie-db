<script setup lang="ts">
import { ref, computed } from 'vue';
import { RegionWatchProviders } from '../../types/index.js';
import { WorkerClient } from '../../services/WorkerClient.js';
import SvgIcon from '../common/SvgIcon.vue';

const props = defineProps<{
  watchProviders: Record<string, RegionWatchProviders>;
  defaultRegion?: string;
}>();

const workerClient = new WorkerClient();
const activeRegion = ref<string>(props.defaultRegion || 'US');

const availableRegions = computed(() => Object.keys(props.watchProviders));

const activeProviderData = computed<RegionWatchProviders | null>(() => {
  return props.watchProviders[activeRegion.value] || null;
});

function getLogo(path: string): string {
  return workerClient.getImageUrl('w92', path);
}
</script>

<template>
  <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 space-y-4 overflow-hidden">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-cyan-400 shrink-0"></span>
        <span>پلتفرم‌های تماشا و استریم آنلاین</span>
      </h3>

      <!-- Region Switcher -->
      <div v-if="availableRegions.length > 1" class="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-fit max-w-full">
        <button
          v-for="reg in availableRegions"
          :key="reg"
          type="button"
          @click="activeRegion = reg"
          class="px-2.5 py-1 rounded-lg font-medium transition shrink-0"
          :class="activeRegion === reg ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          {{ reg }}
        </button>
      </div>
    </div>

    <!-- Providers Content -->
    <div v-if="activeProviderData" class="space-y-4">
      <!-- Subscription (Flatrate) -->
      <div v-if="activeProviderData.flatrate.length > 0">
        <span class="text-xs font-semibold text-slate-400 block mb-2">اشتراکی (Streaming):</span>
        <div class="flex flex-wrap gap-2.5">
          <div
            v-for="p in activeProviderData.flatrate"
            :key="p.id"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition"
          >
            <img
              :src="getLogo(p.logoPath)"
              :alt="p.name"
              width="24"
              height="24"
              loading="lazy"
              class="h-6 w-6 rounded-lg object-cover"
            />
            <span class="text-xs font-medium text-slate-200">{{ p.name }}</span>
          </div>
        </div>
      </div>

      <!-- Rent / Buy -->
      <div v-if="activeProviderData.rent.length > 0 || activeProviderData.buy.length > 0">
        <span class="text-xs font-semibold text-slate-400 block mb-2">کرایه یا خرید دیجیتال:</span>
        <div class="flex flex-wrap gap-2.5">
          <div
            v-for="p in [...activeProviderData.rent, ...activeProviderData.buy]"
            :key="p.id"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition"
          >
            <img
              :src="getLogo(p.logoPath)"
              :alt="p.name"
              width="24"
              height="24"
              loading="lazy"
              class="h-6 w-6 rounded-lg object-cover"
            />
            <span class="text-xs font-medium text-slate-200">{{ p.name }}</span>
          </div>
        </div>
      </div>

      <!-- Free / Ads -->
      <div v-if="activeProviderData.free.length > 0 || activeProviderData.ads.length > 0">
        <span class="text-xs font-semibold text-slate-400 block mb-2">رایگان (با تبلیغات):</span>
        <div class="flex flex-wrap gap-2.5">
          <div
            v-for="p in [...activeProviderData.free, ...activeProviderData.ads]"
            :key="p.id"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:border-slate-700 transition"
          >
            <img
              :src="getLogo(p.logoPath)"
              :alt="p.name"
              width="24"
              height="24"
              loading="lazy"
              class="h-6 w-6 rounded-lg object-cover"
            />
            <span class="text-xs font-medium text-slate-200">{{ p.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-xs text-slate-400 py-3 text-center">
      پلتفرم پخشی برای منطقه {{ activeRegion }} ثبت نشده است.
    </div>

    <!-- Mandatory JustWatch Attribution -->
    <div class="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
      <div class="flex items-center gap-1.5">
        <span>اطلاعات پلتفرم‌ها توسط</span>
        <a
          :href="activeProviderData?.link || 'https://www.justwatch.com'"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-amber-400/90 hover:underline inline-flex items-center gap-1"
        >
          <span>JustWatch</span>
          <SvgIcon name="external-link" size="11" />
        </a>
      </div>
    </div>
  </div>
</template>
