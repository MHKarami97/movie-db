import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

/**
 * Window-scroll based "load more". It measures the remaining scroll distance directly,
 * so it keeps loading until the page is filled and does not depend on element visibility.
 */
export function useInfiniteScroll(totalCount: () => number, pageSize = 30, thresholdPx = 900) {
  const visibleCount = ref(pageSize);
  // Kept for template compatibility; the logic no longer needs a sentinel element.
  const sentinel = ref<HTMLElement | null>(null);
  let frame = 0;

  function remainingPx(): number {
    const doc = document.documentElement;
    return doc.scrollHeight - (window.scrollY + window.innerHeight);
  }

  function fillIfNeeded(): void {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (visibleCount.value >= totalCount()) return;
      if (remainingPx() > thresholdPx) return;

      visibleCount.value = Math.min(visibleCount.value + pageSize, totalCount());
      // After the DOM grows, check again: a tall viewport may still need more items.
      nextTick(fillIfNeeded);
    });
  }

  function reset(): void {
    visibleCount.value = pageSize;
    nextTick(fillIfNeeded);
  }

  onMounted(() => {
    window.addEventListener('scroll', fillIfNeeded, { passive: true });
    window.addEventListener('resize', fillIfNeeded, { passive: true });
    fillIfNeeded();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(frame);
    window.removeEventListener('scroll', fillIfNeeded);
    window.removeEventListener('resize', fillIfNeeded);
  });

  // Data arrives asynchronously (facets file), so re-check whenever the total changes.
  watch(totalCount, () => nextTick(fillIfNeeded));

  return { visibleCount, sentinel, reset };
}
