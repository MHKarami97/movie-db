<script setup lang="ts">
import { ref } from 'vue';
import { useListStore } from '../../stores/listStore.js';
import { MediaType } from '../../types/index.js';
import BaseModal from '../common/BaseModal.vue';
import SvgIcon from '../common/SvgIcon.vue';

const props = defineProps<{
  show: boolean;
  type: MediaType;
  id: number;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const listStore = useListStore();
const newListName = ref('');

function isInList(listId: string): boolean {
  const list = listStore.customLists.find((l) => l.id === listId);
  return Boolean(list?.items.some((i) => i.type === props.type && i.id === props.id));
}

async function handleToggleList(listId: string) {
  if (isInList(listId)) {
    await listStore.removeFromList(listId, props.type, props.id);
  } else {
    await listStore.addToList(listId, props.type, props.id);
  }
}

async function handleCreateAndAdd() {
  if (!newListName.value.trim()) return;
  const created = await listStore.createCustomList(newListName.value);
  await listStore.addToList(created.id, props.type, props.id);
  newListName.value = '';
}
</script>

<template>
  <BaseModal :show="show" :title="'افزودن به لیست: ' + title" @close="emit('close')">
    <div class="space-y-4">
      <!-- Favorites Quick Toggle -->
      <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-800 bg-slate-950/60">
        <div class="flex items-center gap-2.5">
          <SvgIcon name="heart" size="18" :className="listStore.isFavorite(type, id) ? 'text-rose-500 fill-rose-500' : 'text-slate-400'" />
          <span class="text-sm font-bold text-slate-200">علاقه‌مندی‌ها</span>
        </div>
        <button
          type="button"
          @click="listStore.toggleFavorite(type, id)"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold transition"
          :class="listStore.isFavorite(type, id) ? 'bg-rose-500 text-white' : 'border border-slate-700 bg-slate-800 text-slate-300'"
        >
          {{ listStore.isFavorite(type, id) ? 'حذف از علاقه‌مندی' : 'افزودن' }}
        </button>
      </div>

      <!-- Custom Lists -->
      <div class="space-y-2">
        <span class="text-xs font-bold text-slate-400 block">لیست‌های شخصی شما:</span>

        <div v-if="listStore.customLists.length > 0" class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="list in listStore.customLists"
            :key="list.id"
            class="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800/40 transition"
          >
            <span class="text-sm text-slate-200">{{ list.name }}</span>
            <button
              type="button"
              @click="handleToggleList(list.id)"
              class="px-3 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              :class="isInList(list.id) ? 'bg-amber-500 text-slate-950' : 'border border-slate-700 bg-slate-800 text-slate-300'"
            >
              <SvgIcon v-if="isInList(list.id)" name="check" size="14" />
              <span>{{ isInList(list.id) ? 'موجود در لیست' : 'افزودن' }}</span>
            </button>
          </div>
        </div>

        <div v-else class="text-xs text-slate-500 py-2">
          هنوز لیست شخصی نساخته‌اید.
        </div>
      </div>

      <!-- Create New List Inline -->
      <div class="pt-3 border-t border-slate-800 flex gap-2">
        <input
          v-model="newListName"
          type="text"
          placeholder="نام لیست جدید..."
          class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          @keyup.enter="handleCreateAndAdd"
        />
        <button
          type="button"
          @click="handleCreateAndAdd"
          class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
        >
          ایجاد و افزودن
        </button>
      </div>
    </div>
  </BaseModal>
</template>
