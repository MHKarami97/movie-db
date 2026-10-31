import { describe, it, expect } from 'vitest';
import { PersianUtils } from '../src/services/PersianUtils.js';

describe('PersianUtils', () => {
  it('converts English and Arabic digits to Persian digits', () => {
    expect(PersianUtils.toPersianDigits(1234567890)).toBe('۱۲۳۴۵۶۷۸۹۰');
    expect(PersianUtils.toPersianDigits('2025-07-16')).toBe('۲۰۲۵-۰۷-۱۶');
    expect(PersianUtils.toPersianDigits('١٢٣٤٥')).toBe('۱۲۳۴۵');
  });

  it('converts Persian digits back to English ASCII digits', () => {
    expect(PersianUtils.toEnglishDigits('۲۰۲۵')).toBe('2025');
  });

  it('normalizes Arabic characters to Persian (yeh, kaf, diacritics, ZWNJ)', () => {
    // Arabic Yeh and Kaf
    expect(PersianUtils.normalizePersianText('كتاب ياران')).toBe('کتاب یاران');

    // Arabic Tanween and Harakat
    expect(PersianUtils.normalizePersianText('فَوْراً')).toBe('فورا');

    // Hamza and Madda
    expect(PersianUtils.normalizePersianText('آموزش')).toBe('اموزش');
  });

  it('formats digital release gap days nicely in Persian', () => {
    expect(PersianUtils.formatGapDays(45)).toBe('۴۵ روز پس از اکران سینمایی');
    expect(PersianUtils.formatGapDays(0)).toBe('همزمان با اکران سینما');
    expect(PersianUtils.formatGapDays(null)).toBe('');
  });
});
