import { ref, watch, nextTick, onBeforeUnmount } from 'vue';

export function useInfiniteScroll(totalCount: () => number, pageSize = 40) {
  const visibleCount = ref(pageSize);
  const sentinel = ref<HTMLElement | null>(null);

  function loadMore(): boolean {
    if (visibleCount.value >= totalCount()) return false;
    visibleCount.value += pageSize;
    return true;
  }

  function reset(): void {
    visibleCount.value = pageSize;
  }

  function observe(): void {
    observer.disconnect();
    if (sentinel.value) observer.observe(sentinel.value);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting) && loadMore()) {
        // Re-observe so the callback fires again if the sentinel is still visible.
        nextTick(observe);
      }
    },
    { rootMargin: '600px 0px' }
  );

  watch(sentinel, observe, { flush: 'post' });
  onBeforeUnmount(() => observer.disconnect());

  return { visibleCount, sentinel, reset };
}
