import { CompactFilterRecord } from '../types/index.js';
import { BayesianRatingScorer } from './RatingScorer.js';

export type SortKey = 'release_desc' | 'release_asc' | 'rating_desc' | 'votes_desc' | 'title_asc';

export const DEFAULT_SORT: SortKey = 'release_desc';

export const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: 'release_desc', label: 'جدیدترین اکران' },
  { key: 'release_asc', label: 'قدیمی‌ترین اکران' },
  { key: 'rating_desc', label: 'بالاترین امتیاز (وزنی)' },
  { key: 'votes_desc', label: 'بیشترین رأی' },
  { key: 'title_asc', label: 'نام (A تا Z)' }
];

export class TitleSorter {
  private readonly scorer = new BayesianRatingScorer();

  public static sanitize(value: string | null): SortKey {
    return SORT_OPTIONS.some((o) => o.key === value) ? (value as SortKey) : DEFAULT_SORT;
  }

  public sort(items: ReadonlyArray<CompactFilterRecord>, key: SortKey): CompactFilterRecord[] {
    const list = [...items];

    switch (key) {
      case 'release_asc':
        return list.sort((a, b) => this.compareRelease(a, b, 1));
      case 'rating_desc':
        return this.scorer.sortDescending(list, this.scorer.estimatePriorMean(list));
      case 'votes_desc':
        return list.sort((a, b) => b.voteCount - a.voteCount);
      case 'title_asc':
        return list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
      case 'release_desc':
      default:
        return list.sort((a, b) => this.compareRelease(a, b, -1));
    }
  }

  private releaseOf(item: CompactFilterRecord): string {
    return item.releaseDate || (item.year > 0 ? `${item.year}-01-01` : '');
  }

  // Items without a date always go last, regardless of direction.
  private compareRelease(a: CompactFilterRecord, b: CompactFilterRecord, direction: 1 | -1): number {
    const ra = this.releaseOf(a);
    const rb = this.releaseOf(b);

    if (!ra && !rb) return 0;
    if (!ra) return 1;
    if (!rb) return -1;

    return direction * ra.localeCompare(rb) || b.voteCount - a.voteCount;
  }
}
