import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router/index.js';
import './style.css';

const LEGACY_CACHES = ['tmdb-image-cache'];

async function removeLegacyCaches(): Promise<void> {
  if (!('caches' in window)) return;
  await Promise.all(LEGACY_CACHES.map((name) => caches.delete(name)));
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount('#app');

void removeLegacyCaches();
