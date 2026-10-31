import { ref, onMounted, onUnmounted } from 'vue';
import { CountdownService } from '../services/CountdownService.js';
import { CountdownResult } from '../services/interfaces.js';

export function useCountdown(targetIsoDate: () => string) {
  const countdownService = new CountdownService();
  const result = ref<CountdownResult>(countdownService.calculate(targetIsoDate()));
  let timer: number | null = null;

  function update() {
    result.value = countdownService.calculate(targetIsoDate());
  }

  onMounted(() => {
    update();
    timer = window.setInterval(update, 1000);
  });

  onUnmounted(() => {
    if (timer !== null) {
      clearInterval(timer);
    }
  });

  return {
    countdown: result
  };
}
