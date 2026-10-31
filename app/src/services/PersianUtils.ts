export class PersianUtils {
  private static persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  private static arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  public static toPersianDigits(input: number | string | null | undefined): string {
    if (input === null || input === undefined) return '';
    const str = String(input);
    return str
      .replace(/[0-9]/g, (w) => this.persianDigits[parseInt(w, 10)])
      .replace(/[٠-٩]/g, (w) => this.persianDigits[this.arabicDigits.indexOf(w)]);
  }

  public static toEnglishDigits(input: string): string {
    if (!input) return '';
    return input
      .replace(/[۰-۹]/g, (w) => String(this.persianDigits.indexOf(w)))
      .replace(/[٠-٩]/g, (w) => String(this.arabicDigits.indexOf(w)));
  }

  public static normalizePersianText(text: string): string {
    if (!text) return '';

    return text
      // Convert Arabic Yeh to Persian
      .replace(/ي/g, 'ی')
      // Convert Arabic Kaf to Persian
      .replace(/ك/g, 'ک')
      // Convert Arabic Heh with Yeh above to Heh
      .replace(/ۀ/g, 'ه')
      // Convert Alef with Madda/Hamza to simple Alef
      .replace(/[آإأٱ]/g, 'ا')
      // Remove Arabic Tashdeed, Tanween, Harakat
      .replace(/[\u064B-\u065F\u0670]/g, '')
      // Remove Zero-Width Non-Joiner (ZWNJ) for fuzzy search matching
      .replace(/\u200C/g, ' ')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  public static formatGapDays(gapDays: number | null): string {
    if (gapDays === null) return '';
    if (gapDays === 0) return 'همزمان با اکران سینما';
    if (gapDays > 0) return `${this.toPersianDigits(gapDays)} روز پس از اکران سینمایی`;
    return `${this.toPersianDigits(Math.abs(gapDays))} روز پیش از اکران`;
  }
}
