import {
  CastMember,
  MediaType,
  ProviderItem,
  RegionGap,
  RegionReleaseDates,
  RegionWatchProviders,
  TitleDetail,
  CalendarItem,
  VideoItem
} from '../types.js';
import { CONFIG } from '../config.js';

/* eslint-disable @typescript-eslint/no-explicit-any */

export class Normalizer {
  public static normalizeMovie(raw: any, fetchedAt = Date.now()): TitleDetail {
    const releaseDates = this.extractMovieReleaseDates(raw.release_dates?.results);
    const watchProviders = this.extractWatchProviders(raw['watch/providers']?.results);
    const regionGaps = this.calculateRegionGaps(releaseDates);
    const primaryGap = this.getPrimaryGap(regionGaps);
    const translations = this.extractPersianTranslation(raw.translations?.translations);

    const title = translations.faTitle || raw.title || raw.original_title || '';
    const overview = translations.faOverview || raw.overview || '';

    return {
      id: raw.id,
      type: 'movie',
      title,
      originalTitle: raw.original_title || '',
      overview,
      tagline: raw.tagline || '',
      runtime: raw.runtime || null,
      status: raw.status || 'Released',
      genres: (raw.genres || []).map((g: any) => ({ id: g.id, name: g.name })),
      countries: (raw.production_countries || []).map((c: any) => ({
        code: c.iso_3166_1,
        name: c.name
      })),
      languages: (raw.spoken_languages || []).map((l: any) => ({
        code: l.iso_639_1,
        name: l.english_name || l.name
      })),
      companies: (raw.production_companies || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        logoPath: c.logo_path || null
      })),
      keywords: this.extractKeywords(raw.keywords?.keywords || raw.keywords?.results),
      cast: this.extractCast(raw.credits?.cast),
      videos: this.extractVideos(raw.videos?.results),
      releaseDates,
      watchProviders,
      externalIds: {
        imdbId: raw.external_ids?.imdb_id || raw.imdb_id || undefined,
        wikidataId: raw.external_ids?.wikidata_id || undefined,
        facebookId: raw.external_ids?.facebook_id || undefined,
        instagramId: raw.external_ids?.instagram_id || undefined,
        twitterId: raw.external_ids?.twitter_id || undefined
      },
      translations,
      theatricalDate: primaryGap.theatricalDate,
      digitalDate: primaryGap.digitalDate,
      gapDays: primaryGap.gapDays,
      regionGaps,
      posterPath: raw.poster_path || null,
      backdropPath: raw.backdrop_path || null,
      rating: Math.round(((raw.vote_average || 0) + Number.EPSILON) * 10) / 10,
      voteCount: raw.vote_count || 0,
      fetchedAt
    };
  }

  public static normalizeTv(
    raw: any,
    seasonEpisodesMap: Record<number, any[]> = {},
    fetchedAt = Date.now()
  ): TitleDetail {
    const watchProviders = this.extractWatchProviders(raw['watch/providers']?.results);
    const translations = this.extractPersianTranslation(raw.translations?.translations);
    const title = translations.faTitle || raw.name || raw.original_name || '';
    const overview = translations.faOverview || raw.overview || '';

    const firstAirDate = raw.first_air_date ? raw.first_air_date.split('T')[0] : undefined;
    const releaseDates: Record<string, RegionReleaseDates> = {};
    for (const region of CONFIG.configuredRegions) {
      if (firstAirDate) {
        releaseDates[region] = { tv: firstAirDate };
      }
    }

    const regionGaps: Record<string, RegionGap> = {};
    for (const region of CONFIG.configuredRegions) {
      regionGaps[region] = {
        theatricalDate: null,
        digitalDate: firstAirDate || null,
        gapDays: null
      };
    }

    const seasons = (raw.seasons || []).map((s: any) => ({
      seasonNumber: s.season_number,
      name: s.name || `Season ${s.season_number}`,
      episodeCount: s.episode_count || 0,
      airDate: s.air_date ? s.air_date.split('T')[0] : null,
      posterPath: s.poster_path || null,
      overview: s.overview || ''
    }));

    const nextEpisodeToAir = raw.next_episode_to_air
      ? {
          id: raw.next_episode_to_air.id,
          name: raw.next_episode_to_air.name || '',
          airDate: raw.next_episode_to_air.air_date || '',
          seasonNumber: raw.next_episode_to_air.season_number || 1,
          episodeNumber: raw.next_episode_to_air.episode_number || 1,
          overview: raw.next_episode_to_air.overview || ''
        }
      : null;

    const lastEpisodeToAir = raw.last_episode_to_air
      ? {
          id: raw.last_episode_to_air.id,
          name: raw.last_episode_to_air.name || '',
          airDate: raw.last_episode_to_air.air_date || '',
          seasonNumber: raw.last_episode_to_air.season_number || 1,
          episodeNumber: raw.last_episode_to_air.episode_number || 1,
          overview: raw.last_episode_to_air.overview || ''
        }
      : null;

    const episodes: Record<number, any[]> = {};
    for (const [seasonNumStr, epList] of Object.entries(seasonEpisodesMap)) {
      const sNum = parseInt(seasonNumStr, 10);
      episodes[sNum] = (epList || []).map((ep: any) => ({
        episodeNumber: ep.episode_number,
        name: ep.name || '',
        airDate: ep.air_date ? ep.air_date.split('T')[0] : null,
        overview: ep.overview || '',
        stillPath: ep.still_path || null,
        voteAverage: Math.round(((ep.vote_average || 0) + Number.EPSILON) * 10) / 10
      }));
    }

    return {
      id: raw.id,
      type: 'tv',
      title,
      originalTitle: raw.original_name || '',
      overview,
      tagline: raw.tagline || '',
      runtime: raw.episode_run_time?.[0] || null,
      status: raw.status || 'Returning Series',
      genres: (raw.genres || []).map((g: any) => ({ id: g.id, name: g.name })),
      countries: (raw.production_countries || raw.origin_country || []).map((c: any) => ({
        code: typeof c === 'string' ? c : c.iso_3166_1,
        name: typeof c === 'string' ? c : c.name
      })),
      languages: (raw.spoken_languages || []).map((l: any) => ({
        code: l.iso_639_1,
        name: l.english_name || l.name
      })),
      companies: (raw.production_companies || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        logoPath: c.logo_path || null
      })),
      keywords: this.extractKeywords(raw.keywords?.results || raw.keywords?.keywords),
      cast: this.extractCast(raw.credits?.cast),
      videos: this.extractVideos(raw.videos?.results),
      releaseDates,
      watchProviders,
      externalIds: {
        imdbId: raw.external_ids?.imdb_id || undefined,
        wikidataId: raw.external_ids?.wikidata_id || undefined,
        facebookId: raw.external_ids?.facebook_id || undefined,
        instagramId: raw.external_ids?.instagram_id || undefined,
        twitterId: raw.external_ids?.twitter_id || undefined
      },
      translations,
      theatricalDate: null,
      digitalDate: firstAirDate || null,
      gapDays: null,
      regionGaps,
      posterPath: raw.poster_path || null,
      backdropPath: raw.backdrop_path || null,
      rating: Math.round(((raw.vote_average || 0) + Number.EPSILON) * 10) / 10,
      voteCount: raw.vote_count || 0,
      fetchedAt,
      seasons,
      nextEpisodeToAir,
      lastEpisodeToAir,
      episodes: Object.keys(episodes).length > 0 ? episodes : undefined
    };
  }

  public static toCalendarItems(title: TitleDetail): CalendarItem[] {
    const items: CalendarItem[] = [];
    const genreIds = title.genres.map((g) => g.id);
    const originalLanguage = title.languages[0]?.code || 'en';

    if (title.type === 'movie') {
      // Find all distinct release dates across configured regions
      const seenDates = new Set<string>();
      for (const [, dates] of Object.entries(title.releaseDates)) {
        const types: string[] = [];
        let chosenDate: string | null = null;

        if (dates.theatrical) {
          types.push('theatrical');
          chosenDate = chosenDate || dates.theatrical;
        }
        if (dates.digital) {
          types.push('digital');
          chosenDate = chosenDate || dates.digital;
        }
        if (dates.premiere) {
          types.push('premiere');
          chosenDate = chosenDate || dates.premiere;
        }
        if (dates.physical) {
          types.push('physical');
        }

        if (chosenDate && !seenDates.has(chosenDate)) {
          seenDates.add(chosenDate);
          items.push({
            id: title.id,
            type: 'movie',
            title: title.title,
            originalTitle: title.originalTitle,
            date: chosenDate,
            releaseTypes: types.length > 0 ? types : ['theatrical'],
            posterPath: title.posterPath,
            rating: title.rating,
            voteCount: title.voteCount,
            genreIds,
            originalLanguage
          });
        }
      }
    } else {
      // TV Series: First air date or next episode date
      const datesToRecord: Array<{ date: string; type: string }> = [];
      if (title.nextEpisodeToAir?.airDate) {
        datesToRecord.push({ date: title.nextEpisodeToAir.airDate, type: 'tv' });
      } else if (title.digitalDate) {
        datesToRecord.push({ date: title.digitalDate, type: 'tv' });
      }

      for (const item of datesToRecord) {
        items.push({
          id: title.id,
          type: 'tv',
          title: title.title,
          originalTitle: title.originalTitle,
          date: item.date,
          releaseTypes: [item.type],
          posterPath: title.posterPath,
          rating: title.rating,
          voteCount: title.voteCount,
          genreIds,
          originalLanguage
        });
      }
    }

    return items;
  }

  private static extractMovieReleaseDates(results?: any[]): Record<string, RegionReleaseDates> {
    const datesByRegion: Record<string, RegionReleaseDates> = {};
    if (!results || !Array.isArray(results)) return datesByRegion;

    for (const regionData of results) {
      const regionCode = regionData.iso_3166_1;
      if (!regionCode) continue;

      const datesObj: RegionReleaseDates = {};
      const releaseList = regionData.release_dates || [];

      for (const item of releaseList) {
        const dateStr = item.release_date ? item.release_date.split('T')[0] : null;
        if (!dateStr) continue;

        switch (item.type) {
          case 1:
            if (!datesObj.premiere || dateStr < datesObj.premiere) datesObj.premiere = dateStr;
            break;
          case 2:
            if (!datesObj.theatricalLimited || dateStr < datesObj.theatricalLimited)
              datesObj.theatricalLimited = dateStr;
            break;
          case 3:
            if (!datesObj.theatrical || dateStr < datesObj.theatrical) datesObj.theatrical = dateStr;
            break;
          case 4:
            if (!datesObj.digital || dateStr < datesObj.digital) datesObj.digital = dateStr;
            break;
          case 5:
            if (!datesObj.physical || dateStr < datesObj.physical) datesObj.physical = dateStr;
            break;
          case 6:
            if (!datesObj.tv || dateStr < datesObj.tv) datesObj.tv = dateStr;
            break;
        }
      }

      if (Object.keys(datesObj).length > 0) {
        datesByRegion[regionCode] = datesObj;
      }
    }

    return datesByRegion;
  }

  private static extractWatchProviders(results?: any): Record<string, RegionWatchProviders> {
    const providersByRegion: Record<string, RegionWatchProviders> = {};
    if (!results || typeof results !== 'object') return providersByRegion;

    for (const [region, data] of Object.entries(results as Record<string, any>)) {
      const mapList = (list?: any[]): ProviderItem[] =>
        (list || []).map((p) => ({
          id: p.provider_id,
          name: p.provider_name,
          logoPath: p.logo_path || ''
        }));

      providersByRegion[region] = {
        link: data.link || undefined,
        flatrate: mapList(data.flatrate),
        rent: mapList(data.rent),
        buy: mapList(data.buy),
        free: mapList(data.free),
        ads: mapList(data.ads)
      };
    }

    return providersByRegion;
  }

  private static calculateRegionGaps(
    releaseDates: Record<string, RegionReleaseDates>
  ): Record<string, RegionGap> {
    const gaps: Record<string, RegionGap> = {};

    for (const region of CONFIG.configuredRegions) {
      const dates = releaseDates[region];
      const theatrical = dates?.theatrical || dates?.theatricalLimited || null;
      const digital = dates?.digital || null;

      let gapDays: number | null = null;
      if (theatrical && digital) {
        const tTime = new Date(theatrical).getTime();
        const dTime = new Date(digital).getTime();
        if (!isNaN(tTime) && !isNaN(dTime)) {
          gapDays = Math.round((dTime - tTime) / (1000 * 86400));
        }
      }

      gaps[region] = {
        theatricalDate: theatrical,
        digitalDate: digital,
        gapDays
      };
    }

    return gaps;
  }

  private static getPrimaryGap(regionGaps: Record<string, RegionGap>): RegionGap {
    // Prefer US, then first region with gapDays, then first with any date
    if (regionGaps['US'] && (regionGaps['US'].theatricalDate || regionGaps['US'].digitalDate)) {
      return regionGaps['US'];
    }
    for (const gap of Object.values(regionGaps)) {
      if (gap.gapDays !== null) return gap;
    }
    for (const gap of Object.values(regionGaps)) {
      if (gap.theatricalDate || gap.digitalDate) return gap;
    }
    return { theatricalDate: null, digitalDate: null, gapDays: null };
  }

  private static extractPersianTranslation(translations?: any[]): {
    faTitle?: string;
    faOverview?: string;
  } {
    if (!translations || !Array.isArray(translations)) return {};
    const fa = translations.find((t) => t.iso_639_1 === 'fa');
    if (!fa || !fa.data) return {};

    const faTitle = fa.data.title || fa.data.name;
    const faOverview = fa.data.overview;

    return {
      faTitle: faTitle && faTitle.trim() !== '' ? faTitle.trim() : undefined,
      faOverview: faOverview && faOverview.trim() !== '' ? faOverview.trim() : undefined
    };
  }

  private static extractCast(cast?: any[]): CastMember[] {
    if (!cast || !Array.isArray(cast)) return [];
    return cast.slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character || '',
      profilePath: c.profile_path || null
    }));
  }

  private static extractVideos(videos?: any[]): VideoItem[] {
    if (!videos || !Array.isArray(videos)) return [];
    return videos
      .filter((v) => v.site === 'YouTube' && v.key)
      .map((v) => ({
        key: v.key,
        name: v.name || 'Trailer',
        type: v.type || 'Trailer',
        official: Boolean(v.official)
      }));
  }

  private static extractKeywords(keywords?: any[]): string[] {
    if (!keywords || !Array.isArray(keywords)) return [];
    return keywords.map((k) => k.name).filter(Boolean);
  }
}
