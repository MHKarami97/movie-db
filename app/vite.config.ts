import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'robots.txt',
        'fonts/Vazirmatn-font-face.css',
        'fonts/webfonts/*.woff2',
        'icons/*.png'
      ],
      manifest: {
        name: 'تقویم سینما و سریال',
        short_name: 'سینما',
        description: 'تقویم جلالی انتشار فیلم‌ها و سریال‌های روز دنیا',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        dir: 'rtl',
        lang: 'fa-IR',
        icons: [
          {
            src: 'icons/icon-48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: 'icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          {
            name: 'تقویم انتشار',
            short_name: 'تقویم',
            description: 'مشاهده تقویم ماهانه و هفتگی فیلم‌ها و سریال‌ها',
            url: './',
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'جستجو و فیلتر',
            short_name: 'جستجو',
            description: 'جستجوی آفلاین و فیلترهای پیشرفته عناوین',
            url: './search',
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'لیست‌های شخصی',
            short_name: 'لیست‌ها',
            description: 'علاقه‌مندی‌ها و فیلم‌های نشان‌شده',
            url: './lists',
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,json}'],
        runtimeCaching: [
          {
            // StaleWhileRevalidate for data files on branch / deployment
            urlPattern: /.*\/data\/.*\.json/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'tmdb-data-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 86400 * 7 // 7 days
              }
            }
          },
          {
            // CacheFirst for Worker image proxy (90 days immutable)
            urlPattern: /.*\/img\/(w45|w92|w154|w185|w300|w342|w500|w780|w1280|h632|original)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tmdb-image-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 7776000 // 90 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // NetworkFirst with short timeout for Worker API calls
            urlPattern: /.*\/api\/(title|search).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tmdb-api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 86400
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-vue': ['vue', 'vue-router', 'pinia'],
          'vendor-search': ['minisearch', 'idb'],
          'vendor-calendar': ['jalaali-js']
        }
      }
    }
  }
});
