<script setup lang="ts">
import { ref } from 'vue';
import { TvEpisodeSummary, TvSeasonSummary, SeasonEpisodeDetail } from '../../types/index.js';
import { PersianUtils } from '../../services/PersianUtils.js';
import { JalaliDateService } from '../../services/JalaliDateService.js';
import SvgIcon from '../common/SvgIcon.vue';

const props = defineProps<{
  seasons: TvSeasonSummary[];
  nextEpisode?: TvEpisodeSummary | null;
  lastEpisode?: TvEpisodeSummary | null;
  episodes?: Record<number, SeasonEpisodeDetail[]>;
}>();

const dateService = new JalaliDateService();
const expandedSeason = ref<number | null>(
  props.nextEpisode?.seasonNumber || (props.seasons.length > 0 ? props.seasons[props.seasons.length - 1].seasonNumber : null)
);

function toggleSeason(seasonNumber: number) {
  expandedSeason.value = expandedSeason.value === seasonNumber ? null : seasonNumber;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Next Episode to Air Alert Banner -->
    <div
      v-if="nextEpisode"
      class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
    >
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
          <SvgIcon name="play" size="20" />
        </div>
        <div>
          <span class="text-xs font-semibold text-cyan-400 block">قسمت بعدی در راه:</span>
          <h4 class="text-sm font-bold text-slate-100">
            فصل {{ PersianUtils.toPersianDigits(nextEpisode.seasonNumber) }}، قسمت {{ PersianUtils.toPersianDigits(nextEpisode.episodeNumber) }}: {{ nextEpisode.name }}
          </h4>
        </div>
      </div>

      <div class="text-xs font-semibold bg-slate-900/80 border border-cyan-500/20 px-3 py-1.5 rounded-xl self-end sm:self-auto">
        تاریخ پخش: {{ dateService.formatJalali(nextEpisode.airDate) }}
      </div>
    </div>

    <!-- Seasons Accordion -->
    <div class="space-y-2">
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-cyan-400"></span>
        <span>فصل‌ها و قسمت‌ها</span>
      </h3>

      <div class="space-y-2">
        <div
          v-for="season in seasons"
          :key="season.seasonNumber"
          class="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden"
        >
          <button
            type="button"
            @click="toggleSeason(season.seasonNumber)"
            class="w-full flex items-center justify-between p-3.5 text-right hover:bg-slate-800/40 transition"
          >
            <div class="flex items-center gap-2.5">
              <span class="text-sm font-bold text-slate-200">{{ season.name }}</span>
              <span class="text-xs text-slate-400">
                ({{ PersianUtils.toPersianDigits(season.episodeCount) }} قسمت)
              </span>
            </div>

            <div class="flex items-center gap-2 text-xs text-slate-400">
              <span v-if="season.airDate">{{ dateService.formatJalali(season.airDate) }}</span>
              <SvgIcon
                name="chevron-down"
                size="16"
                :class="expandedSeason === season.seasonNumber ? 'rotate-180 transition' : 'transition'"
              />
            </div>
          </button>

          <!-- Episodes List for Expanded Season -->
          <div
            v-if="expandedSeason === season.seasonNumber && episodes?.[season.seasonNumber]"
            class="border-t border-slate-800/80 p-3 space-y-2 bg-slate-950/40"
          >
            <div
              v-for="ep in episodes[season.seasonNumber]"
              :key="ep.episodeNumber"
              class="flex items-start justify-between gap-3 p-2.5 rounded-lg hover:bg-slate-900 transition text-xs"
            >
              <div class="flex items-start gap-2.5">
                <span class="font-bold text-amber-400 mt-0.5">
                  {{ PersianUtils.toPersianDigits(ep.episodeNumber) }}.
                </span>
                <div>
                  <h5 class="font-bold text-slate-200">{{ ep.name }}</h5>
                  <p v-if="ep.overview" class="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                    {{ ep.overview }}
                  </p>
                </div>
              </div>

              <span v-if="ep.airDate" class="shrink-0 text-slate-500 font-mono text-[10px]">
                {{ ep.airDate }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
