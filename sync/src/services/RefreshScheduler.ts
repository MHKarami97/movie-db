import { CONFIG } from '../config.js';
import { KnownId, TitleDetail } from '../types.js';

export interface RefreshDecision {
  toFetchNew: KnownId[];
  toRefreshOldest: KnownId[];
  toPruneFromDisk: KnownId[];
}

export class RefreshScheduler {
  private maxCacheAgeMs: number;
  private retentionOutOfWindowMs: number;
  private budget: number;

  constructor(
    maxCacheAgeDays = CONFIG.maxCacheAgeDays,
    retentionOutOfWindowDays = CONFIG.retentionOutOfWindowDays,
    budget = CONFIG.refreshBudgetPerRun
  ) {
    this.maxCacheAgeMs = maxCacheAgeDays * 86400 * 1000;
    this.retentionOutOfWindowMs = retentionOutOfWindowDays * 86400 * 1000;
    this.budget = budget;
  }

  public plan(
    discoveredInWindow: KnownId[],
    existingRecords: TitleDetail[],
    nowMs = Date.now()
  ): RefreshDecision {
    const existingMap = new Map<string, TitleDetail>();
    for (const record of existingRecords) {
      existingMap.set(`${record.type}-${record.id}`, record);
    }

    const discoveredKeys = new Set(
      discoveredInWindow.map((d) => `${d.type}-${d.id}`)
    );

    // 1. New items in window that do not exist yet on disk
    const toFetchNew: KnownId[] = [];
    for (const item of discoveredInWindow) {
      if (!existingMap.has(`${item.type}-${item.id}`)) {
        toFetchNew.push(item);
      }
    }

    // 2. Existing records that are older than 90 days and still in window
    const candidatesForRefresh: Array<{ id: KnownId; fetchedAt: number }> = [];
    const toPruneFromDisk: KnownId[] = [];

    for (const record of existingRecords) {
      const key = `${record.type}-${record.id}`;
      const ageMs = nowMs - (record.fetchedAt || 0);
      const isInWindow = discoveredKeys.has(key);

      if (isInWindow) {
        if (ageMs > this.maxCacheAgeMs) {
          candidatesForRefresh.push({
            id: { type: record.type, id: record.id },
            fetchedAt: record.fetchedAt || 0
          });
        }
      } else {
        // Out of window: check if expired beyond retention limit (150 days)
        if (ageMs > this.retentionOutOfWindowMs) {
          toPruneFromDisk.push({ type: record.type, id: record.id });
        }
      }
    }

    // Sort candidates oldest first
    candidatesForRefresh.sort((a, b) => a.fetchedAt - b.fetchedAt);

    // Limit by per-run budget
    const toRefreshOldest = candidatesForRefresh
      .slice(0, this.budget)
      .map((c) => c.id);

    return {
      toFetchNew,
      toRefreshOldest,
      toPruneFromDisk
    };
  }
}
