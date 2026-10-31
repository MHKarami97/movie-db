<script setup lang="ts">
import { onMounted } from 'vue';
import { useSettingsStore } from '../stores/settingsStore.js';
import { JalaliDateService } from '../services/JalaliDateService.js';
import { PersianUtils } from '../services/PersianUtils.js';
import SvgIcon from '../components/common/SvgIcon.vue';

const settingsStore = useSettingsStore();
const dateService = new JalaliDateService();

onMounted(() => {
  settingsStore.loadMeta();
});

const regions = [
  { code: 'IR', label: 'ایران (IR)' },
  { code: 'US', label: 'ایالات متحده آمریکا (US)' },
  { code: 'GB', label: 'بریتانیا (GB)' },
  { code: 'DE', label: 'آلمان (DE)' },
  { code: 'CA', label: 'کانادا (CA)' }
];
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div class="border-b border-slate-800 pb-4">
      <h2 class="text-xl font-black text-slate-100">تنظیمات و درباره برنامه</h2>
      <p class="text-xs text-slate-400 mt-1">پیکربندی ظاهر، منطقه پیش‌فرض و وضعیت پایگاه داده</p>
    </div>

    <!-- Theme Setting -->
    <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
        <SvgIcon name="sun" size="16" className="text-amber-400" />
        <span>پوسته و تم رنگی</span>
      </h3>

      <div class="grid grid-cols-3 gap-3">
        <button
          type="button"
          @click="settingsStore.setTheme('system')"
          class="flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-semibold transition"
          :class="settingsStore.theme === 'system' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="settings" size="18" className="mb-1" />
          <span>هماهنگ با سیستم</span>
        </button>

        <button
          type="button"
          @click="settingsStore.setTheme('dark')"
          class="flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-semibold transition"
          :class="settingsStore.theme === 'dark' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="moon" size="18" className="mb-1" />
          <span>تاریک (پیش‌فرض)</span>
        </button>

        <button
          type="button"
          @click="settingsStore.setTheme('light')"
          class="flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-semibold transition"
          :class="settingsStore.theme === 'light' ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'"
        >
          <SvgIcon name="sun" size="18" className="mb-1" />
          <span>روشن</span>
        </button>
      </div>
    </div>

    <!-- Default Region -->
    <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
        <SvgIcon name="globe" size="16" className="text-cyan-400" />
        <span>منطقه اکران و پلتفرم‌های پیش‌فرض</span>
      </h3>
      <p class="text-xs text-slate-400 leading-relaxed">
        تاریخ‌های اکران سینما و سرویس‌های استریم ابتدا بر اساس این منطقه نمایش داده می‌شوند.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          v-for="r in regions"
          :key="r.code"
          type="button"
          @click="settingsStore.setRegion(r.code)"
          class="flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition"
          :class="settingsStore.selectedRegion === r.code ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'"
        >
          <span>{{ r.label }}</span>
          <SvgIcon v-if="settingsStore.selectedRegion === r.code" name="check" size="14" />
        </button>
      </div>
    </div>

    <!-- Data Freshness & Cache -->
    <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
      <h3 class="text-sm font-bold text-slate-100 flex items-center gap-2">
        <SvgIcon name="clock" size="16" className="text-emerald-400" />
        <span>وضعیت داده‌ها و کش محلی</span>
      </h3>

      <div v-if="settingsStore.meta" class="space-y-2 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        <div class="flex justify-between">
          <span class="text-slate-500">آخرین زمان همگام‌سازی کاتالوگ:</span>
          <span class="font-bold text-slate-200">
            {{ dateService.formatJalali(settingsStore.meta.generatedAt) }}
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">تعداد کل عناوین ذخیره شده:</span>
          <span class="font-mono text-amber-400 font-bold">
            {{ PersianUtils.toPersianDigits(settingsStore.meta.counts.totalTitles) }} عنوان
          </span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">پنجره زمانی آرشیو:</span>
          <span class="font-mono text-slate-400">
            {{ settingsStore.meta.window.start }} تا {{ settingsStore.meta.window.end }}
          </span>
        </div>
      </div>

      <div class="flex justify-between items-center pt-2">
        <p class="text-xs text-slate-400">در صورت بروز مشکل در تصاویر یا فونت‌ها، کش را پاک کنید.</p>
        <button
          type="button"
          @click="settingsStore.clearCache()"
          class="px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition"
        >
          پاکسازی کامل کش
        </button>
      </div>
    </div>

    <!-- Website Info -->
    <div class="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
      <span>تقویم و اطلاعات انتشار فیلم‌ها و سریال‌های روز دنیا</span>
      <a
        href="https://mhkarami97.ir"
        target="_blank"
        rel="noopener noreferrer"
        class="text-amber-400 hover:underline font-mono dir-ltr font-semibold"
      >
        mhkarami97.ir
      </a>
    </div>
  </div>
</template>
