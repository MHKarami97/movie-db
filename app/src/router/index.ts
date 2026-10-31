import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import CalendarView from '../views/CalendarView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'calendar',
    component: CalendarView
  },
  {
    path: '/title/:type/:id',
    name: 'title-detail',
    component: () => import('../views/TitleDetailView.vue')
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue')
  },
  {
    path: '/lists',
    name: 'lists',
    component: () => import('../views/ListsView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue')
  }
];

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'smooth' };
  }
});

// Resolve redirect from 404.html SPA fallback on GitHub Pages
const query = new URLSearchParams(window.location.search);
const redirectPath = query.get('p');
if (redirectPath) {
  const cleanRedirect = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
  window.history.replaceState(null, '', import.meta.env.BASE_URL + cleanRedirect.slice(1));
  router.replace(cleanRedirect);
}
