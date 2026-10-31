import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ThemeService } from '../services/ThemeService.js';
import { DataRepository } from '../services/DataRepository.js';
import { MetaData } from '../types/index.js';
import { RegionPolicy } from '../config/regions.js';

export const useSettingsStore = defineStore('settings', () => {
  const themeService = new ThemeService();
  const dataRepo = new DataRepository();

  const theme = ref<'system' | 'light' | 'dark'>(themeService.getCurrentTheme());
  const selectedRegion = ref<string>(RegionPolicy.normalize(localStorage.getItem('default_region')));
  const meta = ref<MetaData | null>(null);
  const loading = ref(false);

  function setTheme(newTheme: 'system' | 'light' | 'dark') {
    theme.value = newTheme;
    themeService.setTheme(newTheme);
  }

  function setRegion(region: string) {
    const safeRegion = RegionPolicy.normalize(region);
    selectedRegion.value = safeRegion;
    localStorage.setItem('default_region', safeRegion);
  }

  async function loadMeta() {
    loading.value = true;
    try {
      meta.value = await dataRepo.getMeta();
    } finally {
      loading.value = false;
    }
  }

  async function clearCache() {
    // Clear localStorage (except custom settings) and service worker caches
    if ('caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }
    window.location.reload();
  }

  return {
    theme,
    selectedRegion,
    meta,
    loading,
    setTheme,
    setRegion,
    loadMeta,
    clearCache
  };
});
