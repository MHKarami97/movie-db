import { describe, it, expect } from 'vitest';
import { BayesianRatingScorer } from '../src/services/RatingScorer.js';

describe('BayesianRatingScorer', () => {
  const scorer = new BayesianRatingScorer(50, 6.5);

  it('does not let a single vote outrank a well-voted title', () => {
    const lonely = { rating: 10, voteCount: 1 };
    const solid = { rating: 7.5, voteCount: 2000 };
    const sorted = scorer.sortDescending([lonely, solid], 6.5);
    expect(sorted[0]).toBe(solid);
  });

  it('puts unrated titles last', () => {
    const unrated = { rating: 0, voteCount: 0 };
    const rated = { rating: 4, voteCount: 10 };
    expect(scorer.sortDescending([unrated, rated], 6.5)[1]).toBe(unrated);
  });
});
