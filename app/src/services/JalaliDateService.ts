import { toJalaali, toGregorian, jalaaliMonthLength, isLeapJalaaliYear } from 'jalaali-js';
import { CalendarDayCell, IJalaliDateService } from './interfaces.js';
import { PersianUtils } from './PersianUtils.js';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const JALALI_WEEK_DAYS = [
  { key: 'sa', name: 'شنبه', short: 'ش' },
  { key: 'su', name: 'یکشنبه', short: 'ی' },
  { key: 'mo', name: 'دوشنبه', short: 'د' },
  { key: 'tu', name: 'سه‌شنبه', short: 'س' },
  { key: 'we', name: 'چهارشنبه', short: 'چ' },
  { key: 'th', name: 'پنج‌شنبه', short: 'پ' },
  { key: 'fr', name: 'جمعه', short: 'ج' }
];

export class JalaliDateService implements IJalaliDateService {
  public toJalaali(gregorianDate: Date | string): { jy: number; jm: number; jd: number } {
    let d: Date;
    if (typeof gregorianDate === 'string') {
      const parts = gregorianDate.split('T')[0].split('-').map(Number);
      d = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      d = gregorianDate;
    }
    return toJalaali(d);
  }

  public toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
    return toGregorian(jy, jm, jd);
  }

  public formatJalali(date: Date | string): string {
    const { jy, jm, jd } = this.toJalaali(date);
    const mName = this.getMonthName(jm);
    return `${PersianUtils.toPersianDigits(jd)} ${mName} ${PersianUtils.toPersianDigits(jy)}`;
  }

  public getMonthName(jm: number): string {
    return JALALI_MONTH_NAMES[jm - 1] || '';
  }

  public isLeapYear(jy: number): boolean {
    return isLeapJalaaliYear(jy);
  }

  public getMonthGrid(jy: number, jm: number): CalendarDayCell[] {
    const daysInMonth = jalaaliMonthLength(jy, jm);
    const firstDayGregorian = toGregorian(jy, jm, 1);
    const firstDate = new Date(
      firstDayGregorian.gy,
      firstDayGregorian.gm - 1,
      firstDayGregorian.gd
    );

    // Gregorian getDay: 0 = Sun, 1 = Mon, ..., 6 = Sat
    // In Persian calendar, week starts on Saturday:
    // Saturday -> 0, Sunday -> 1, ..., Friday -> 6
    const gregorianDay = firstDate.getDay();
    const leadingPaddingDays = (gregorianDay + 1) % 7;

    const cells: CalendarDayCell[] = [];

    // Today in Jalali
    const todayJalali = this.toJalaali(new Date());

    // 1. Previous month leading padding
    if (leadingPaddingDays > 0) {
      const prevJm = jm === 1 ? 12 : jm - 1;
      const prevJy = jm === 1 ? jy - 1 : jy;
      const prevMonthLength = jalaaliMonthLength(prevJy, prevJm);

      for (let i = leadingPaddingDays - 1; i >= 0; i--) {
        const jDay = prevMonthLength - i;
        const g = toGregorian(prevJy, prevJm, jDay);
        const iso = this.formatIsoDate(g.gy, g.gm, g.gd);
        const isFriday = cells.length % 7 === 6;

        cells.push({
          jYear: prevJy,
          jMonth: prevJm,
          jDay,
          dateIso: iso,
          isCurrentMonth: false,
          isToday: false,
          isFriday,
          persianDayText: PersianUtils.toPersianDigits(jDay)
        });
      }
    }

    // 2. Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const g = toGregorian(jy, jm, day);
      const iso = this.formatIsoDate(g.gy, g.gm, g.gd);
      const isToday =
        todayJalali.jy === jy && todayJalali.jm === jm && todayJalali.jd === day;
      const isFriday = cells.length % 7 === 6;

      cells.push({
        jYear: jy,
        jMonth: jm,
        jDay: day,
        dateIso: iso,
        isCurrentMonth: true,
        isToday,
        isFriday,
        persianDayText: PersianUtils.toPersianDigits(day)
      });
    }

    // 3. Trailing padding to fill complete weeks (multiple of 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    if (remaining > 0) {
      const nextJm = jm === 12 ? 1 : jm + 1;
      const nextJy = jm === 12 ? jy + 1 : jy;

      for (let day = 1; day <= remaining; day++) {
        const g = toGregorian(nextJy, nextJm, day);
        const iso = this.formatIsoDate(g.gy, g.gm, g.gd);
        const isFriday = cells.length % 7 === 6;

        cells.push({
          jYear: nextJy,
          jMonth: nextJm,
          jDay: day,
          dateIso: iso,
          isCurrentMonth: false,
          isToday: false,
          isFriday,
          persianDayText: PersianUtils.toPersianDigits(day)
        });
      }
    }

    return cells;
  }

  private formatIsoDate(year: number, month: number, day: number): string {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
