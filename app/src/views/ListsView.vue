<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useListStore } from '../stores/listStore.js';
import { ListItemRecord } from '../types/index.js';
import { PersianUtils } from '../services/PersianUtils.js';
import SvgIcon from '../components/common/SvgIcon.vue';
import EmptyState from '../components/common/EmptyState.vue';
import BaseModal from '../components/common/BaseModal.vue';

const route = useRoute();
const listStore = useListStore();

const activeTab = ref<'favorites' | 'custom' | 'shared'>('favorites');
const newListName = ref('');
const showCreateModal = ref(false);
const sharedItems = ref<ListItemRecord[]>([]);
const shareCopied = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  await listStore.loadAll();

  // Check if URL contains shared list
  const sharedParam = (route.query.shared as string) || (window.location.hash.includes('shared=') ? window.location.hash.split('shared=')[1] : '');
  if (sharedParam) {
    sharedItems.value = listStore.decodeShareLink(decodeURIComponent(sharedParam));
    if (sharedItems.value.length > 0) {
      activeTab.value = 'shared';
    }
  }
});

async function handleCreateList() {
  if (!newListName.value.trim()) return;
  await listStore.createCustomList(newListName.value);
  newListName.value = '';
  showCreateModal.value = false;
}

async function handleExport() {
  const json = await listStore.exportBackup();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moviedb-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function handleImportClick() {
  fileInput.value?.click();
}

async function handleFileSelected(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const text = await file.text();
  try {
    await listStore.importBackup(text);
    alert('پشتیبان با موفقیت بازیابی شد.');
  } catch (err: any) {
    alert(err?.message || 'خطا در بازیابی فایل.');
  }
}

function handleCopyShare(items: ListItemRecord[]) {
  const link = listStore.encodeShareLink(items);
  navigator.clipboard.writeText(link);
  shareCopied.value = true;
  setTimeout(() => (shareCopied.value = false), 2500);
}
</script>

<template>
  <div class="space-y-6">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-800 bg-slate-900/40">
      <!-- Tabs -->
      <div class="inline-flex rounded-xl p-1 bg-slate-950 border border-slate-800 text-xs">
        <button
          type="button"
          @click="activeTab = 'favorites'"
          class="px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
          :class="activeTab === 'favorites' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="heart" size="14" :className="activeTab === 'favorites' ? 'fill-slate-950' : ''" />
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

        <button
          v-if="sharedItems.length > 0"
          type="button"
          @click="activeTab = 'shared'"
          class="px-4 py-2 rounded-lg font-bold transition flex items-center gap-2"
          :class="activeTab === 'shared' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="share" size="14" />
          <span>لیست اشتراکی</span>
        </button>
      </div>

      <!-- Import / Export Actions -->
      <div class="flex items-center gap-2">
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          class="hidden"
          @change="handleFileSelected"
        />
        <button
          type="button"
          @click="handleImportClick"
          class="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          بازیابی فایل
        </button>
        <button
          type="button"
          @click="handleExport"
          class="px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
        >
          پشتیبان‌گیری (JSON)
        </button>
      </div>
    </div>

    <!-- TAB 1: FAVORITES -->
    <div v-if="activeTab === 'favorites'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-bold text-slate-200">فیلم‌ها و سریال‌های نشان‌شده</h3>
        <button
          v-if="listStore.favorites.length > 0"
          type="button"
          @click="handleCopyShare(listStore.favorites)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
        >
          <SvgIcon name="share" size="14" />
          <span>{{ shareCopied ? 'لینک کپی شد!' : 'اشتراک‌گذاری لیست' }}</span>
        </button>
      </div>

      <div v-if="listStore.favorites.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="item in listStore.favorites"
          :key="item.type + '-' + item.id"
          class="flex items-center justify-between p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition"
        >
          <router-link
            :to="`/title/${item.type}/${item.id}`"
            class="flex items-center gap-3 min-w-0"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
              <SvgIcon name="calendar" size="20" />
            </div>
            <div class="truncate">
              <span class="text-xs font-bold text-slate-200 block truncate">
                شناسه: {{ PersianUtils.toPersianDigits(item.id) }}
              </span>
              <span class="text-[11px] text-slate-400">
                {{ item.type === 'movie' ? 'فیلم سینمایی' : 'سریال تلویزیونی' }}
              </span>
            </div>
          </router-link>

          <div class="flex items-center gap-2">
            <!-- Watched Toggle -->
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

            <!-- Remove Button -->
            <button
              type="button"
              @click="listStore.toggleFavorite(item.type, item.id)"
              class="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
              title="حذف از لیست"
            >
              <SvgIcon name="trash" size="15" />
            </button>
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

    <!-- TAB 2: CUSTOM LISTS -->
    <div v-else-if="activeTab === 'custom'" class="space-y-6">
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
              <span class="text-xs text-slate-400">
                {{ PersianUtils.toPersianDigits(list.items.length) }} عنوان در این لیست
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="list.items.length > 0"
                type="button"
                @click="handleCopyShare(list.items)"
                class="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
              >
                اشتراک‌گذاری
              </button>
              <button
                type="button"
                @click="listStore.deleteCustomList(list.id)"
                class="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 hover:bg-rose-500/20 transition"
                title="حذف کل لیست"
              >
                <SvgIcon name="trash" size="16" />
              </button>
            </div>
          </div>

          <div v-if="list.items.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            <div
              v-for="item in list.items"
              :key="item.type + '-' + item.id"
              class="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/60"
            >
              <router-link :to="`/title/${item.type}/${item.id}`" class="text-xs text-slate-200 hover:text-amber-400 font-bold truncate">
                شناسه: {{ PersianUtils.toPersianDigits(item.id) }} ({{ item.type === 'movie' ? 'فیلم' : 'سریال' }})
              </router-link>
              <button
                type="button"
                @click="listStore.removeFromList(list.id, item.type, item.id)"
                class="text-rose-400 hover:text-rose-300 p-1"
                title="حذف از این لیست"
              >
                <SvgIcon name="close" size="14" />
              </button>
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

    <!-- TAB 3: SHARED LIST VIEW -->
    <div v-else-if="activeTab === 'shared'" class="space-y-4">
      <div class="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-center justify-between">
        <div>
          <h4 class="text-sm font-bold text-slate-100">لیست به اشتراک گذاشته شده</h4>
          <p class="text-xs text-amber-400 mt-0.5">این عناوین از طریق پیوند ارسالی کاربر باز شده‌اند.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <router-link
          v-for="item in sharedItems"
          :key="'shared-' + item.type + '-' + item.id"
          :to="`/title/${item.type}/${item.id}`"
          class="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 transition"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <SvgIcon name="calendar" size="20" />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-200 block truncate">
              شناسه: {{ PersianUtils.toPersianDigits(item.id) }}
            </span>
            <span class="text-[11px] text-slate-400">
              {{ item.type === 'movie' ? 'فیلم سینمایی' : 'سریال تلویزیونی' }}
            </span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Create List Modal -->
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
          <button
            type="button"
            @click="showCreateModal = false"
            class="px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            انصراف
          </button>
          <button
            type="button"
            @click="handleCreateList"
            class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition"
          >
            ایجاد لیست
          </button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>
