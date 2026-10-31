import { ref, onMounted, onUnmounted, Ref } from 'vue';

const now = ref<number>(Date.now());
let subscribers = 0;
let timer: number | null = null;

export function useNowTicker(intervalMs = 60_000): Ref<number> {
  onMounted(() => {
    subscribers++;
    if (timer === null) {
      now.value = Date.now();
      timer = window.setInterval(() => (now.value = Date.now()), intervalMs);
    }
  });

  onUnmounted(() => {
    subscribers--;
    if (subscribers === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  });

  return now;
}
