import { JalaliDateService } from '../services/JalaliDateService.js';
import { PersianUtils } from '../services/PersianUtils.js';

export function useJalali() {
  const service = new JalaliDateService();

  function formatJalali(date: Date | string): string {
    return service.formatJalali(date);
  }

  function toPersianDigits(n: number | string | null | undefined): string {
    return PersianUtils.toPersianDigits(n);
  }

  function formatGap(gapDays: number | null): string {
    return PersianUtils.formatGapDays(gapDays);
  }

  return {
    service,
    formatJalali,
    toPersianDigits,
    formatGap
  };
}
