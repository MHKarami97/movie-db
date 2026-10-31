<script setup lang="ts">
import { ref } from 'vue';
import AppHeader from './components/common/AppHeader.vue';
import MobileNav from './components/common/MobileNav.vue';
import SvgIcon from './components/common/SvgIcon.vue';

// PWA update notification state
const needRefresh = ref(false);

// Listen to service worker update events if supported
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    needRefresh.value = true;
  });
}

function reloadApp() {
  window.location.reload();
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-amber-500/20 selection:text-amber-300">
    <!-- PWA Update Toast -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="needRefresh"
        class="fixed top-4 inset-x-4 z-50 max-w-md mx-auto p-4 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-2xl flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          <SvgIcon name="info" size="18" />
          <span class="text-xs">نسخه جدید برنامه در دسترس است!</span>
        </div>
        <button
          type="button"
          @click="reloadApp"
          class="px-3 py-1.5 rounded-lg bg-slate-950 text-amber-400 text-xs font-black shadow"
        >
          به‌روزرسانی
        </button>
      </div>
    </transition>

    <!-- Top Navigation Header -->
    <AppHeader />

    <!-- Main Views Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Footer for Desktop -->
    <footer class="hidden md:block border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
      <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>تقویم سینما و سریال | تاریخ اکران و پخش آنلاین</span>
        <a
          href="https://mhkarami97.ir"
          target="_blank"
          rel="noopener noreferrer"
          class="font-mono text-xs hover:text-amber-400 transition"
        >
          mhkarami97.ir
        </a>
      </div>
    </footer>

    <!-- Bottom Navigation Bar for Mobile -->
    <MobileNav />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
