import { CountdownResult, ICountdownService } from './interfaces.js';
import { PersianUtils } from './PersianUtils.js';

export class CountdownService implements ICountdownService {
  public calculate(targetIsoDate: string): CountdownResult {
    if (!targetIsoDate) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: true,
        formatted: 'تاریخ نامشخص'
      };
    }

    const targetTime = new Date(`${targetIsoDate.split('T')[0]}T00:00:00Z`).getTime();
    const nowTime = Date.now();
    const diffMs = targetTime - nowTime;

    if (diffMs <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isPast: true,
        formatted: 'اکران شده'
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${PersianUtils.toPersianDigits(days)} روز`);
    if (hours > 0 || days > 0) parts.push(`${PersianUtils.toPersianDigits(hours)} ساعت`);
    parts.push(`${PersianUtils.toPersianDigits(minutes)} دقیقه`);

    return {
      days,
      hours,
      minutes,
      seconds,
      isPast: false,
      formatted: `${parts.join(' و ')} دیگر`
    };
  }
}
