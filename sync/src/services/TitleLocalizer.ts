/* eslint-disable @typescript-eslint/no-explicit-any */

interface TranslationEntry {
  iso_639_1?: string;
  iso_3166_1?: string;
  data?: { title?: string; name?: string };
}

/**
 * Resolves the English display title of a TMDB entity.
 * Priority: explicit "en" translation -> en-US localized title -> original title.
 */
export class TitleLocalizer {
  public static resolveEnglishTitle(
    localizedTitle: string | undefined,
    originalTitle: string | undefined,
    translations?: TranslationEntry[]
  ): string {
    const fromTranslation = this.findEnglishTranslation(translations);
    if (fromTranslation) return fromTranslation;

    const localized = (localizedTitle ?? '').trim();
    if (localized) return localized;

    return (originalTitle ?? '').trim();
  }

  private static findEnglishTranslation(translations?: TranslationEntry[]): string | undefined {
    if (!Array.isArray(translations)) return undefined;

    const english = translations.filter((t) => t.iso_639_1 === 'en');
    const preferred = english.find((t) => t.iso_3166_1 === 'US') ?? english[0];
    const value = (preferred?.data?.title || preferred?.data?.name || '').trim();

    return value || undefined;
  }
}
