<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
    <div class="text-6xl font-black text-amber-500 font-mono">۴۰۴</div>
    <h2 class="text-xl font-bold text-slate-100">صفحه مورد نظر یافت نشد</h2>
    <p class="text-xs text-slate-400 max-w-sm">
      ممکن است آدرس وارد شده نادرست باشد یا این اثر هنوز به تقویم اضافه نشده باشد.
    </p>
    <router-link
      to="/"
      class="inline-block px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
    >
      بازگشت به تقویم اصلی
    </router-link>
  </div>
</template>
