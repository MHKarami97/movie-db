<script setup lang="ts">
import { CastMember } from '../../types/index.js';
import { WorkerClient } from '../../services/WorkerClient.js';
import SvgIcon from '../common/SvgIcon.vue';

defineProps<{
  cast: CastMember[];
}>();

const workerClient = new WorkerClient();

function getProfile(path: string | null): string {
  return workerClient.getImageUrl('w185', path);
}
</script>

<template>
  <div v-if="cast.length > 0" class="space-y-3">
    <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
      <span class="h-2 w-2 rounded-full bg-amber-400"></span>
      <span>بازیگران اصلی</span>
    </h3>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      <div
        v-for="member in cast"
        :key="member.id"
        class="flex flex-col items-center text-center p-3 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition group"
      >
        <div class="h-16 w-16 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 group-hover:border-amber-400/60 transition mb-2.5">
          <img
            v-if="member.profilePath"
            :src="getProfile(member.profilePath)"
            :alt="member.name"
            width="64"
            height="64"
            loading="lazy"
            decoding="async"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center text-slate-600">
            <SvgIcon name="info" size="24" />
          </div>
        </div>

        <span class="text-xs font-bold text-slate-200 truncate w-full group-hover:text-amber-400 transition">
          {{ member.name }}
        </span>
        <span class="text-[11px] text-slate-400 truncate w-full mt-0.5">
          {{ member.character }}
        </span>
      </div>
    </div>
  </div>
</template>
