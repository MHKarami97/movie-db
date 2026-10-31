export interface RatedItem {
  readonly rating: number;
  readonly voteCount: number;
}

export interface IRatingScorer {
  estimatePriorMean(items: ReadonlyArray<RatedItem>): number;
  score(item: RatedItem, priorMean: number): number;
  sortDescending<T extends RatedItem>(items: ReadonlyArray<T>, priorMean: number): T[];
}

/**
 * Bayesian (weighted) rating: WR = v / (v + m) * R + m / (v + m) * C
 * R = item rating, v = vote count, m = minimum votes for full trust, C = prior mean.
 * Items without any vote sink to the bottom.
 */
export class BayesianRatingScorer implements IRatingScorer {
  public static readonly UNRATED_SCORE = -1;

  public constructor(
    private readonly minVotes: number = 50,
    private readonly fallbackMean: number = 6.5
  ) {}

  public estimatePriorMean(items: ReadonlyArray<RatedItem>): number {
    let weightedSum = 0;
    let totalVotes = 0;

    for (const item of items) {
      if (item.voteCount > 0) {
        weightedSum += item.rating * item.voteCount;
        totalVotes += item.voteCount;
      }
    }

    return totalVotes > 0 ? weightedSum / totalVotes : this.fallbackMean;
  }

  public score(item: RatedItem, priorMean: number): number {
    if (item.voteCount <= 0) return BayesianRatingScorer.UNRATED_SCORE;

    const v = item.voteCount;
    const m = this.minVotes;
    return (v / (v + m)) * item.rating + (m / (v + m)) * priorMean;
  }

  public sortDescending<T extends RatedItem>(items: ReadonlyArray<T>, priorMean: number): T[] {
    return items
      .map((item) => ({ item, score: this.score(item, priorMean) }))
      .sort((a, b) => b.score - a.score || b.item.voteCount - a.item.voteCount)
      .map((entry) => entry.item);
  }
}
