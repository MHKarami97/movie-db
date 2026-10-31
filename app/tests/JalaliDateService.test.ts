import { describe, it, expect } from 'vitest';
import { JalaliDateService } from '../src/services/JalaliDateService.js';

describe('JalaliDateService', () => {
  const service = new JalaliDateService();

  it('accurately converts known historical Gregorian dates to Jalali and back', () => {
    // 2025-03-21 is Farvardin 1, 1404
    const jalali = service.toJalaali('2025-03-21');
    expect(jalali.jy).toBe(1404);
    expect(jalali.jm).toBe(1);
    expect(jalali.jd).toBe(1);

    const backToGregorian = service.toGregorian(1404, 1, 1);
    expect(backToGregorian.gy).toBe(2025);
    expect(backToGregorian.gm).toBe(3);
    expect(backToGregorian.gd).toBe(21);
  });

  it('correctly detects Jalali leap years', () => {
    // 1403 was a Jalali leap year (Esfand had 30 days)
    expect(service.isLeapYear(1403)).toBe(true);
    // 1404 is not a leap year
    expect(service.isLeapYear(1404)).toBe(false);
  });

  it('computes a complete month grid starting with Saturday (index 0)', () => {
    // Farvardin 1404 (31 days)
    // 2025-03-21 is Friday (جمعه), which in Persian week is index 6.
    // So leading padding should be 6 days (Saturday to Thursday of previous month)
    const grid = service.getMonthGrid(1404, 1);

    // Total cells must be a multiple of 7
    expect(grid.length % 7).toBe(0);
    expect(grid.length).toBeGreaterThanOrEqual(35);

    // Check that current month days total 31
    const currentMonthCells = grid.filter((c) => c.isCurrentMonth);
    expect(currentMonthCells.length).toBe(31);

    // Check first day cell of Farvardin
    expect(currentMonthCells[0].jYear).toBe(1404);
    expect(currentMonthCells[0].jMonth).toBe(1);
    expect(currentMonthCells[0].jDay).toBe(1);
    expect(currentMonthCells[0].dateIso).toBe('2025-03-21');

    // Check Friday flag on cell index 6
    expect(grid[6].isFriday).toBe(true);
  });
});
