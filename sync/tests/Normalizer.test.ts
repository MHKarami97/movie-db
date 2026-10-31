import { describe, it, expect } from 'vitest';
import { Normalizer } from '../src/services/Normalizer.js';

describe('Normalizer', () => {
  it('correctly maps movie details, calculates theatrical/digital dates and gapDays', () => {
    const rawMovie = {
      id: 101,
      title: 'Inception',
      original_title: 'Inception',
      overview: 'A thief steals corporate secrets...',
      tagline: 'Your mind is the scene of the crime',
      runtime: 148,
      status: 'Released',
      vote_average: 8.35,
      vote_count: 35000,
      poster_path: '/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
      backdrop_path: '/s3TBrRGB1iav7gFOCNx3H31MoES.jpg',
      genres: [{ id: 28, name: 'Action' }, { id: 878, name: 'Science Fiction' }],
      production_countries: [{ iso_3166_1: 'US', name: 'United States' }],
      spoken_languages: [{ iso_639_1: 'en', english_name: 'English' }],
      production_companies: [{ id: 999, name: 'Syncopy', logo_path: '/logo.png' }],
      credits: {
        cast: [
          { id: 1, name: 'Leonardo DiCaprio', character: 'Cobb', profile_path: '/leo.jpg' },
          { id: 2, name: 'Joseph Gordon-Levitt', character: 'Arthur', profile_path: '/joe.jpg' }
        ]
      },
      videos: {
        results: [
          { key: 'YoHD9XEInc0', site: 'YouTube', type: 'Trailer', official: true },
          { key: 'other', site: 'Vimeo', type: 'Trailer', official: false }
        ]
      },
      release_dates: {
        results: [
          {
            iso_3166_1: 'US',
            release_dates: [
              { type: 3, release_date: '2025-07-16T00:00:00.000Z' },
              { type: 4, release_date: '2025-09-01T00:00:00.000Z' }
            ]
          }
        ]
      },
      'watch/providers': {
        results: {
          US: {
            link: 'https://tmdb.org/watch',
            flatrate: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/netflix.png' }],
            rent: [],
            buy: [],
            free: [],
            ads: []
          }
        }
      },
      translations: {
        translations: [
          {
            iso_639_1: 'fa',
            data: {
              title: 'تلقین',
              overview: 'یک دزد ماهر به درون رویاها نفوذ می‌کند...'
            }
          }
        ]
      }
    };

    const normalized = Normalizer.normalizeMovie(rawMovie, 1700000000000);

    expect(normalized.id).toBe(101);
    expect(normalized.type).toBe('movie');
    expect(normalized.title).toBe('Inception'); // Original/primary title preferred
    expect(normalized.originalTitle).toBe('Inception');
    expect(normalized.overview).toContain('یک دزد ماهر');
    expect(normalized.rating).toBe(8.4); // 8.35 rounded to 1 decimal
    expect(normalized.theatricalDate).toBe('2025-07-16');
    expect(normalized.digitalDate).toBe('2025-09-01');
    // Gap: July 16 to Sept 01 is 47 days
    expect(normalized.gapDays).toBe(47);
    expect(normalized.regionGaps['US'].gapDays).toBe(47);
    expect(normalized.videos.length).toBe(1);
    expect(normalized.videos[0].key).toBe('YoHD9XEInc0');
    expect(normalized.watchProviders['US'].flatrate[0].name).toBe('Netflix');
  });

  it('correctly maps TV details and episodes', () => {
    const rawTv = {
      id: 202,
      name: 'Severance',
      original_name: 'Severance',
      overview: 'Mark leads a team...',
      first_air_date: '2025-01-17',
      status: 'Returning Series',
      vote_average: 8.6,
      vote_count: 2000,
      seasons: [
        { season_number: 1, name: 'Season 1', episode_count: 9, air_date: '2025-01-17' },
        { season_number: 2, name: 'Season 2', episode_count: 10, air_date: '2026-01-17' }
      ],
      next_episode_to_air: {
        id: 9901,
        name: 'Hello Kier',
        air_date: '2026-01-17',
        season_number: 2,
        episode_number: 1,
        overview: 'Season 2 premiere'
      }
    };

    const episodesMap = {
      2: [
        {
          episode_number: 1,
          name: 'Hello Kier',
          air_date: '2026-01-17',
          overview: 'The team returns...',
          still_path: '/still.jpg',
          vote_average: 9.1
        }
      ]
    };

    const normalized = Normalizer.normalizeTv(rawTv, episodesMap);

    expect(normalized.id).toBe(202);
    expect(normalized.type).toBe('tv');
    expect(normalized.nextEpisodeToAir?.name).toBe('Hello Kier');
    expect(normalized.episodes?.[2]?.[0].name).toBe('Hello Kier');
  });
});
