<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useListStore } from '../stores/listStore.js';
import { useTitleResolver } from '../composables/useTitleResolver.js';
import { WorkerClient } from '../services/WorkerClient.js';
import { PersianUtils } from '../services/PersianUtils.js';
import SvgIcon from '../components/common/SvgIcon.vue';
import EmptyState from '../components/common/EmptyState.vue';
import BaseModal from '../components/common/BaseModal.vue';
import PosterImage from '../components/common/PosterImage.vue';
import ShareButton from '../components/common/ShareButton.vue';
import ReleaseCountdown from '../components/lists/ReleaseCountdown.vue';

const listStore = useListStore();
const { getTitle, getPosterPath, getYear, loadIndexTitles } = useTitleResolver();
const workerClient = new WorkerClient();

const activeTab = ref<'favorites' | 'custom'>('favorites');
const newListName = ref('');
const showCreateModal = ref(false);

function getPoster(path: string | null): string {
  return workerClient.getImageUrl('w185', path);
}

onMounted(async () => {
  await Promise.all([listStore.loadAll(), loadIndexTitles()]);
});

async function handleCreateList() {
  if (!newListName.value.trim()) return;
  await listStore.createCustomList(newListName.value);
  newListName.value = '';
  showCreateModal.value = false;
}
</script>

<template>
  <div class="space-y-6">
    <!-- Tabs -->
    <div class="p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
      <div class="inline-flex rounded-xl p-1 bg-slate-950 border border-slate-800 text-xs">
        <button
          type="button"
          @click="activeTab = 'favorites'"
          class="px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
          :class="activeTab === 'favorites' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="heart" size="14" :class-name="activeTab === 'favorites' ? 'fill-slate-950' : ''" />
          <span>علاقه‌مندی‌ها ({{ PersianUtils.toPersianDigits(listStore.favorites.length) }})</span>
        </button>

        <button
          type="button"
          @click="activeTab = 'custom'"
          class="px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
          :class="activeTab === 'custom' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="bookmark" size="14" />
          <span>لیست‌های شخصی ({{ PersianUtils.toPersianDigits(listStore.customLists.length) }})</span>
        </button>
      </div>
    </div>

    <!-- FAVORITES -->
    <div v-if="activeTab === 'favorites'" class="space-y-4">
      <h3 class="text-sm font-bold text-slate-200">فیلم‌ها و سریال‌های نشان‌شده</h3>

      <div v-if="listStore.favorites.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="item in listStore.favorites"
          :key="item.type + '-' + item.id"
          class="flex flex-col gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition"
        >
          <router-link :to="`/title/${item.type}/${item.id}`" class="flex items-center gap-3.5 min-w-0 group">
            <div class="relative w-12 h-16 shrink-0 rounded-xl overflow-hidden border border-slate-700/80">
              <PosterImage
                :src="getPoster(getPosterPath(item.type, item.id, item.posterPath))"
                :alt="getTitle(item.type, item.id, item.title)"
                :icon-size="20"
                img-class="group-hover:scale-105 transition duration-300"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm font-bold text-slate-100 block truncate group-hover:text-amber-400 transition text-right" dir="ltr">
                {{ getTitle(item.type, item.id, item.title) }}
              </h4>
              <div class="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                  :class="item.type === 'movie' ? 'bg-amber-500/15 text-amber-300' : 'bg-cyan-500/15 text-cyan-300'"
                >
                  {{ item.type === 'movie' ? 'فیلم سینمایی' : 'سریال تلویزیونی' }}
                </span>
                <span v-if="getYear(item.type, item.id)" class="font-mono text-slate-500">({{ getYear(item.type, item.id) }})</span>
              </div>
              <ReleaseCountdown :type="item.type" :id="item.id" />
            </div>
          </router-link>

          <div class="flex items-center justify-between gap-2 border-t border-slate-800/70 pt-3">
            <button
              type="button"
              @click="listStore.toggleWatched(item.type, item.id)"
              class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition"
              :class="item.watched ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'"
              title="تغییر وضعیت مشاهده"
            >
              <SvgIcon name="check" size="12" />
              <span>{{ item.watched ? 'دیده‌شده' : 'ندیده‌ام' }}</span>
            </button>

            <div class="flex items-center gap-2">
              <ShareButton :type="item.type" :id="item.id" :title="getTitle(item.type, item.id, item.title)" compact />
              <button
                type="button"
                @click="listStore.toggleFavorite(item.type, item.id)"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                title="حذف از لیست"
                aria-label="حذف از لیست"
              >
                <SvgIcon name="trash" size="15" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        icon="heart"
        title="لیست علاقه‌مندی‌ها خالی است"
        description="می‌توانید در صفحه تقویم یا جزئیات هر فیلم و سریال، روی دکمه افزودن به علاقه‌مندی کلیک کنید."
      />
    </div>

    <!-- CUSTOM LISTS -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-200">لیست‌های دسته‌بندی شخصی</h3>
        <button
          type="button"
          @click="showCreateModal = true"
          class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-sm"
        >
          <SvgIcon name="plus" size="14" />
          <span>ساخت لیست جدید</span>
        </button>
      </div>

      <div v-if="listStore.customLists.length > 0" class="space-y-4">
        <div
          v-for="list in listStore.customLists"
          :key="list.id"
          class="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4"
        >
          <div class="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 class="text-base font-bold text-slate-100">{{ list.name }}</h4>
              <span class="text-xs text-slate-400">{{ PersianUtils.toPersianDigits(list.items.length) }} عنوان در این لیست</span>
            </div>
            <button
              type="button"
              @click="listStore.deleteCustomList(list.id)"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
              title="حذف کل لیست"
              aria-label="حذف کل لیست"
            >
              <SvgIcon name="trash" size="16" />
            </button>
          </div>

          <div v-if="list.items.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div
              v-for="item in list.items"
              :key="item.type + '-' + item.id"
              class="flex items-start justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60 gap-2"
            >
              <router-link :to="`/title/${item.type}/${item.id}`" class="flex items-center gap-2.5 min-w-0 flex-1 group">
                <div class="w-10 h-14 shrink-0 rounded-lg overflow-hidden border border-slate-700/60 relative">
                  <PosterImage
                    :src="getPoster(getPosterPath(item.type, item.id, item.posterPath))"
                    :alt="getTitle(item.type, item.id, item.title)"
                    :icon-size="16"
                  />
                </div>
                <div class="min-w-0">
                  <span class="text-xs text-slate-200 font-bold block truncate group-hover:text-amber-400 transition text-right" dir="ltr">
                    {{ getTitle(item.type, item.id, item.title) }}
                  </span>
                  <span class="text-[10px] text-slate-400">{{ item.type === 'movie' ? 'فیلم' : 'سریال' }}</span>
                  <ReleaseCountdown :type="item.type" :id="item.id" />
                </div>
              </router-link>

              <div class="flex shrink-0 items-center gap-1">
                <ShareButton :type="item.type" :id="item.id" :title="getTitle(item.type, item.id, item.title)" compact />
                <button
                  type="button"
                  @click="listStore.removeFromList(list.id, item.type, item.id)"
                  class="flex h-9 w-9 items-center justify-center text-rose-400 hover:text-rose-300"
                  title="حذف از این لیست"
                  aria-label="حذف از این لیست"
                >
                  <SvgIcon name="close" size="14" />
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-slate-500">این لیست خالی است.</p>
        </div>
      </div>

      <EmptyState
        v-else
        icon="bookmark"
        title="هنوز لیست شخصی نساخته‌اید"
        description="می‌توانید لیست‌های دلخواهی مثل «فیلم‌های تعطیلات»، «مارول» یا «برندگان اسکار» بسازید."
        action-text="ساخت اولین لیست"
        @action="showCreateModal = true"
      />
    </div>

    <BaseModal :show="showCreateModal" title="ساخت لیست شخصی جدید" @close="showCreateModal = false">
      <div class="space-y-4">
        <div>
          <label class="text-xs font-bold text-slate-400 block mb-1.5">نام لیست:</label>
          <input
            v-model="newListName"
            type="text"
            placeholder="مثال: فیلم‌های مورد انتظار سال..."
            class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            @keyup.enter="handleCreateList"
          />
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="showCreateModal = false" class="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold">
            انصراف
          </button>
          <button type="button" @click="handleCreateList" class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition">
            ایجاد لیست
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
