<template>
  <div class="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400">
    <!-- TMDB Primary Logo (Small & subtle to follow branding rules) -->
    <a
      href="https://www.themoviedb.org"
      target="_blank"
      rel="noopener noreferrer"
      class="shrink-0 opacity-80 hover:opacity-100 transition"
      aria-label="وب‌سایت پایگاه داده فیلم TMDB"
    >
      <svg
        class="h-4 w-auto text-[#01b4e4]"
        viewBox="0 0 184 16"
        fill="currentColor"
        role="img"
      >
        <path d="M14.7 3.5h-4.3v12.2h-3V3.5H3.1V.9h11.6v2.6zm23.6 12.2V6.2L34.1 14h-2.4l-4.2-7.8v9.5h-3V.9h3.6l4.8 9.1L37.7.9h3.6v14.8h-3zm18.3 0h-7.6V.9h7.3c2.4 0 4.2.7 5.4 2 1.2 1.3 1.8 3.1 1.8 5.4s-.6 4.1-1.8 5.4c-1.2 1.3-3 2-5.1 2zm-4.6-2.5h4.6c1.5 0 2.6-.4 3.4-1.3.8-.9 1.1-2.1 1.1-3.6 0-1.6-.4-2.8-1.1-3.6-.8-.9-1.9-1.3-3.4-1.3h-4.6v9.8zm23.7 2.5h-7.5V.9h7.4c2.1 0 3.8.5 4.9 1.6 1.1 1 1.7 2.4 1.7 4 0 1.2-.3 2.1-.9 2.9-.6.8-1.5 1.4-2.7 1.7 1.4.3 2.5 1 3.2 1.9.7.9 1.1 2 1.1 3.3 0 1.8-.6 3.2-1.8 4.3-1.2 1.1-2.9 1.7-5.4 1.7zm-4.5-2.5h4.4c1.3 0 2.3-.3 3-.9.7-.6 1.1-1.4 1.1-2.4 0-1.1-.4-1.9-1.1-2.5-.7-.6-1.7-.9-3-.9h-4.4v6.7zm0-8.8h4c1.2 0 2.1-.3 2.8-.8.7-.5 1-1.3 1-2.2 0-1-.3-1.7-1-2.2-.7-.5-1.6-.8-2.8-.8h-4v6zm47.9 11.3V.9h3.1v14.8h-3.1zm17.4-4.8l-1.9 4.8h-3.3l5.8-14.8h3.5l5.8 14.8h-3.4l-1.9-4.8h-4.6zm4.1-2.6l-1.8-4.7-1.8 4.7h3.6zm19.3-7.4h-5.2v14.8h-3.1V3.5h-5.2V.9h13.5v2.6zm13.7 14.8V.9h3.1v14.8h-3.1z" />
      </svg>
    </a>

    <!-- Official required wording -->
    <div class="flex-1 space-y-1">
      <p class="leading-relaxed">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
      <p class="text-[11px] text-slate-500">
        اطلاعات عناوین و پوسترها از پایگاه داده TMDB و وضعیت پلتفرم‌های پخش آنلاین (Streaming) توسط JustWatch ارائه می‌شود.
      </p>
    </div>
  </div>
</template>
