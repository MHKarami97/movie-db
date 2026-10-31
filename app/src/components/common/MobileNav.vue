<script setup lang="ts">
import { useRoute } from 'vue-router';
import SvgIcon from './SvgIcon.vue';

const route = useRoute();

const navItems = [
  { name: 'تقویم', path: '/', icon: 'calendar' },
  { name: 'جستجو', path: '/search', icon: 'search' },
  { name: 'لیست‌ها', path: '/lists', icon: 'bookmark' },
  { name: 'تنظیمات', path: '/settings', icon: 'settings' }
];
</script>

<template>
  <nav class="fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-slate-950/95 backdrop-blur-lg pb-safe md:hidden">
    <div class="grid grid-cols-4 h-16">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center justify-center min-h-[44px] gap-1 transition select-none"
        :class="[
          route.path === item.path
            ? 'text-amber-400 font-semibold'
            : 'text-slate-400 hover:text-slate-200'
        ]"
      >
        <SvgIcon :name="item.icon" size="20" />
        <span class="text-[11px] leading-none">{{ item.name }}</span>
      </router-link>
    </div>
  </nav>
</template>
