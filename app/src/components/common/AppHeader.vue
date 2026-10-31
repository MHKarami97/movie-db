<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useSettingsStore } from '../../stores/settingsStore.js';
import SvgIcon from './SvgIcon.vue';

const route = useRoute();
const settingsStore = useSettingsStore();

const isDark = computed(() => {
  if (settingsStore.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return settingsStore.theme === 'dark';
});

function toggleTheme() {
  const next = isDark.value ? 'light' : 'dark';
  settingsStore.setTheme(next);
}

const navItems = [
  { name: 'تقویم', path: '/', icon: 'calendar' },
  { name: 'جستجو و فیلتر', path: '/search', icon: 'search' },
  { name: 'لیست‌ها', path: '/lists', icon: 'bookmark' },
  { name: 'تنظیمات', path: '/settings', icon: 'settings' }
];
</script>

<template>
  <header class="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <!-- App Brand -->
      <router-link to="/" class="flex items-center gap-3 group">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:border-amber-500/40 transition">
          <SvgIcon name="calendar" size="22" />
        </div>
        <div>
          <span class="block text-base font-bold text-slate-100 tracking-tight leading-tight">تقویم سینما</span>
          <span class="block text-xs text-slate-400">تاریخ اکران و پخش آنلاین</span>
        </div>
      </router-link>

      <!-- Desktop Navigation Links -->
      <nav class="hidden md:flex items-center gap-1">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition"
          :class="[
            route.path === item.path
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900'
          ]"
        >
          <SvgIcon :name="item.icon" size="18" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- Quick Actions -->
      <div class="flex items-center gap-2">
        <!-- Theme Toggle -->
        <button
          type="button"
          @click="toggleTheme"
          class="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition"
          :title="isDark ? 'تغییر به تم روشن' : 'تغییر به تم تاریک'"
          aria-label="تغییر تم"
        >
          <SvgIcon :name="isDark ? 'sun' : 'moon'" size="18" />
        </button>
      </div>
    </div>
  </header>
</template>
