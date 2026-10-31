import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ListRepository } from '../services/ListRepository.js';
import { CustomList, ListItemRecord, MediaType } from '../types/index.js';

export const useListStore = defineStore('list', () => {
  const listRepo = new ListRepository();

  const favorites = ref<ListItemRecord[]>([]);
  const customLists = ref<CustomList[]>([]);
  const loading = ref(false);

  async function loadAll() {
    loading.value = true;
    try {
      const [favs, lists] = await Promise.all([
        listRepo.getFavorites(),
        listRepo.getCustomLists()
      ]);
      favorites.value = favs;
      customLists.value = lists;
    } finally {
      loading.value = false;
    }
  }

  function isFavorite(type: MediaType, id: number): boolean {
    return favorites.value.some((f) => f.type === type && f.id === id);
  }

  function isWatched(type: MediaType, id: number): boolean {
    const fav = favorites.value.find((f) => f.type === type && f.id === id);
    return Boolean(fav?.watched);
  }

  async function toggleFavorite(type: MediaType, id: number, title?: string, posterPath?: string | null) {
    const active = await listRepo.toggleFavorite(type, id, title, posterPath);
    if (active) {
      favorites.value.push({
        type,
        id,
        title,
        posterPath,
        addedAt: Date.now(),
        watched: false
      });
    } else {
      favorites.value = favorites.value.filter((f) => !(f.type === type && f.id === id));
    }
    return active;
  }

  async function toggleWatched(type: MediaType, id: number) {
    const watched = await listRepo.toggleWatched(type, id);
    const fav = favorites.value.find((f) => f.type === type && f.id === id);
    if (fav) {
      fav.watched = watched;
    }
    return watched;
  }

  async function createCustomList(name: string) {
    const created = await listRepo.createCustomList(name);
    customLists.value.push(created);
    return created;
  }

  async function deleteCustomList(id: string) {
    await listRepo.deleteCustomList(id);
    customLists.value = customLists.value.filter((l) => l.id !== id);
  }

  async function addToList(listId: string, type: MediaType, id: number, title?: string, posterPath?: string | null) {
    await listRepo.addToList(listId, type, id, title, posterPath);
    const list = customLists.value.find((l) => l.id === listId);
    if (list && !list.items.some((i) => i.type === type && i.id === id)) {
      list.items.push({ type, id, title, posterPath, addedAt: Date.now(), watched: false });
    }
  }

  async function removeFromList(listId: string, type: MediaType, id: number) {
    await listRepo.removeFromList(listId, type, id);
    const list = customLists.value.find((l) => l.id === listId);
    if (list) {
      list.items = list.items.filter((i) => !(i.type === type && i.id === id));
    }
  }

  async function exportBackup(): Promise<string> {
    return await listRepo.exportBackup();
  }

  async function importBackup(jsonString: string) {
    await listRepo.importBackup(jsonString);
    await loadAll();
  }

  return {
    favorites,
    customLists,
    loading,
    loadAll,
    isFavorite,
    isWatched,
    toggleFavorite,
    toggleWatched,
    createCustomList,
    deleteCustomList,
    addToList,
    removeFromList,
    exportBackup,
    importBackup
  };
});
