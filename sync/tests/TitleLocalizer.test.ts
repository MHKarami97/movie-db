import { describe, it, expect } from 'vitest';
import { TitleLocalizer } from '../src/services/TitleLocalizer.js';

describe('TitleLocalizer', () => {
  it('prefers the English translation over the original title', () => {
    const result = TitleLocalizer.resolveEnglishTitle('流浪地球', '流浪地球', [
      { iso_639_1: 'en', iso_3166_1: 'US', data: { title: 'The Wandering Earth' } }
    ]);
    expect(result).toBe('The Wandering Earth');
  });

  it('falls back to the localized title, then to the original', () => {
    expect(TitleLocalizer.resolveEnglishTitle('Hero', '英雄', [])).toBe('Hero');
    expect(TitleLocalizer.resolveEnglishTitle('', '英雄', undefined)).toBe('英雄');
  });
});
