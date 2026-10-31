import {
  CompactFilterRecord,
  FacetsData,
  ProviderItem,
  TitleDetail
} from '../types.js';

export class FacetBuilder {
  public static build(titles: TitleDetail[], todayIso = new Date().toISOString().split('T')[0]): FacetsData {
    const genreMap = new Map<number, string>();
    const countryMap = new Map<string, string>();
    const langMap = new Map<string, string>();
    const companyMap = new Map<number, string>();
    const providerMap = new Map<number, { name: string; logoPath: string }>();

    const compactTitles: CompactFilterRecord[] = [];

    for (const t of titles) {
      let year = 0;
      if (t.theatricalDate) {
        year = parseInt(t.theatricalDate.substring(0, 4), 10) || 0;
      } else if (t.digitalDate) {
        year = parseInt(t.digitalDate.substring(0, 4), 10) || 0;
      }

      // Collect dictionaries
      for (const g of t.genres) {
        genreMap.set(g.id, g.name);
      }
      for (const c of t.countries) {
        countryMap.set(c.code, c.name);
      }
      for (const l of t.languages) {
        langMap.set(l.code, l.name);
      }
      for (const comp of t.companies) {
        companyMap.set(comp.id, comp.name);
      }

      const titleProviders = new Set<number>();
      for (const wp of Object.values(t.watchProviders)) {
        const allProviders: ProviderItem[] = [
          ...wp.flatrate,
          ...wp.rent,
          ...wp.buy,
          ...wp.free,
          ...wp.ads
        ];
        for (const p of allProviders) {
          titleProviders.add(p.id);
          if (!providerMap.has(p.id)) {
            providerMap.set(p.id, { name: p.name, logoPath: p.logoPath });
          }
        }
      }

      const releaseTypesSet = new Set<string>();
      for (const rDates of Object.values(t.releaseDates)) {
        if (rDates.theatrical) releaseTypesSet.add('theatrical');
        if (rDates.digital) releaseTypesSet.add('digital');
        if (rDates.premiere) releaseTypesSet.add('premiere');
        if (rDates.physical) releaseTypesSet.add('physical');
        if (rDates.tv) releaseTypesSet.add('tv');
      }

      // In cinema but not yet online check:
      const isInCinemaNotOnline = Boolean(
        t.theatricalDate &&
          t.theatricalDate <= todayIso &&
          (!t.digitalDate || t.digitalDate > todayIso)
      );

      compactTitles.push({
        id: t.id,
        type: t.type,
        year,
        rating: t.rating,
        voteCount: t.voteCount,
        runtime: t.runtime || 0,
        genres: t.genres.map((g) => g.id),
        countries: t.countries.map((c) => c.code),
        languages: t.languages.map((l) => l.code),
        companies: t.companies.map((c) => c.id),
        providers: Array.from(titleProviders),
        hasTrailer: t.videos.length > 0,
        inCinemaNotOnline: isInCinemaNotOnline,
        status: t.status,
        releaseTypes: Array.from(releaseTypesSet)
      });
    }

    // Sort compact titles deterministically by id
    compactTitles.sort((a, b) => a.id - b.id);

    return {
      titles: compactTitles,
      dictionaries: {
        genres: Array.from(genreMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        countries: Array.from(countryMap.entries())
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        languages: Array.from(langMap.entries())
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        companies: Array.from(companyMap.entries())
          .map(([id, name]) => ({ id, name }))
          .sort((a, b) => a.name.localeCompare(b.name)),
        providers: Array.from(providerMap.entries())
          .map(([id, p]) => ({ id, name: p.name, logoPath: p.logoPath }))
          .sort((a, b) => a.name.localeCompare(b.name))
      }
    };
  }
}
