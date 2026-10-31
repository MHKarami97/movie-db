import * as path from 'node:path';
import { CONFIG } from './config.js';
import { TmdbClient } from './client/TmdbClient.js';
import { DiscoverService } from './services/DiscoverService.js';
import { TitleFetcher } from './services/TitleFetcher.js';
import { RefreshScheduler } from './services/RefreshScheduler.js';
import { Normalizer } from './services/Normalizer.js';
import { SearchIndexBuilder } from './services/SearchIndexBuilder.js';
import { FacetBuilder } from './services/FacetBuilder.js';
import { JsonStore } from './storage/JsonStore.js';
import { GitPublisher } from './storage/GitPublisher.js';
import { CalendarItem, KnownId, TitleDetail } from './types.js';

export async function runSync(options?: {
  dataDir?: string;
  publishGit?: boolean;
  targetDate?: Date;
}): Promise<void> {
  const targetDate = options?.targetDate || new Date();
  const dataDir = options?.dataDir || path.resolve(process.cwd(), '../data-branch');
  const shouldPublish = options?.publishGit ?? process.argv.includes('--publish');

  console.log(`[sync] Starting TMDB catalog synchronization...`);
  console.log(`[sync] Target date: ${targetDate.toISOString().split('T')[0]}`);
  console.log(`[sync] Target data directory: ${dataDir}`);

  // Calculate dynamic data window
  const windowStart = new Date(
    targetDate.getFullYear() - CONFIG.yearsPast,
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const windowEnd = new Date(
    targetDate.getFullYear() + CONFIG.yearsFuture,
    targetDate.getMonth(),
    targetDate.getDate()
  );

  console.log(
    `[sync] Window: ${windowStart.toISOString().split('T')[0]} to ${windowEnd.toISOString().split('T')[0]}`
  );

  const jsonStore = new JsonStore(dataDir);
  jsonStore.ensureDirectories();

  const tmdbClient = new TmdbClient();
  const discoverService = new DiscoverService(tmdbClient);
  const titleFetcher = new TitleFetcher(tmdbClient);
  const scheduler = new RefreshScheduler();

  // Load existing data from disk
  const existingKnownIds = jsonStore.readKnownIds();
  const existingTitles = jsonStore.readAllExistingTitles();
  console.log(
    `[sync] Loaded from disk: ${existingKnownIds.length} known IDs, ${existingTitles.length} title details`
  );

  // Ensure all existing titles use their original/primary name
  for (const t of existingTitles) {
    if (t.originalTitle && t.title !== t.originalTitle) {
      t.title = t.originalTitle;
      jsonStore.writeTitleDetail(t);
    }
  }

  // Discover all titles in window
  console.log(`[sync] Discovering movie and TV titles in window slices...`);
  const discoveredInWindow = await discoverService.discoverAllInWindow(windowStart, windowEnd);
  console.log(`[sync] Discovered ${discoveredInWindow.length} titles in current window.`);

  // Update permanent IDs list
  const knownIdMap = new Map<string, KnownId>();
  for (const item of existingKnownIds) {
    knownIdMap.set(`${item.type}-${item.id}`, item);
  }
  for (const item of discoveredInWindow) {
    knownIdMap.set(`${item.type}-${item.id}`, item);
  }
  const allKnownIds = Array.from(knownIdMap.values());
  jsonStore.writeKnownIds(allKnownIds);

  // Plan refreshes, new fetches, and pruning
  const plan = scheduler.plan(discoveredInWindow, existingTitles, targetDate.getTime());
  console.log(
    `[sync] Plan: ${plan.toFetchNew.length} new titles to fetch, ` +
      `${plan.toRefreshOldest.length} titles to refresh (>90 days old, budget ${CONFIG.refreshBudgetPerRun}), ` +
      `${plan.toPruneFromDisk.length} out-of-window records to prune (>150 days old).`
  );

  // Prune expired out-of-window records
  for (const item of plan.toPruneFromDisk) {
    jsonStore.removeTitleDetail(item.type, item.id);
  }

  // Map of current active title details
  const titlesMap = new Map<string, TitleDetail>();
  for (const t of existingTitles) {
    // Exclude pruned
    const isPruned = plan.toPruneFromDisk.some(
      (p) => p.type === t.type && p.id === t.id
    );
    if (!isPruned) {
      titlesMap.set(`${t.type}-${t.id}`, t);
    }
  }

  // Fetch new items
  const fetchQueue = [...plan.toFetchNew, ...plan.toRefreshOldest];
  let processed = 0;

  for (const item of fetchQueue) {
    processed++;
    if (processed % 20 === 0 || processed === fetchQueue.length) {
      console.log(`[sync] Fetching title details: ${processed}/${fetchQueue.length}...`);
    }

    try {
      if (item.type === 'movie') {
        const detail = await titleFetcher.fetchMovie(item.id, targetDate.getTime());
        titlesMap.set(`movie-${item.id}`, detail);
        jsonStore.writeTitleDetail(detail);
      } else {
        const detail = await titleFetcher.fetchTv(item.id, windowStart, targetDate.getTime());
        titlesMap.set(`tv-${item.id}`, detail);
        jsonStore.writeTitleDetail(detail);
      }
    } catch (err: unknown) {
      console.warn(`[sync] Failed to fetch ${item.type}/${item.id}:`, err);
    }
  }

  const allActiveTitles = Array.from(titlesMap.values());
  console.log(`[sync] Total active stored titles: ${allActiveTitles.length}`);

  // Generate calendar items
  console.log(`[sync] Generating calendar entries...`);
  const calendarItems: CalendarItem[] = [];
  const startIso = windowStart.toISOString().split('T')[0];
  const endIso = windowEnd.toISOString().split('T')[0];

  for (const title of allActiveTitles) {
    const items = Normalizer.toCalendarItems(title);
    for (const item of items) {
      if (item.date >= startIso && item.date <= endIso) {
        calendarItems.push(item);
      }
    }
  }
  jsonStore.writeCalendar(calendarItems);

  // Build and save MiniSearch index
  console.log(`[sync] Building search index...`);
  const searchIndexJson = SearchIndexBuilder.build(allActiveTitles);
  jsonStore.writeSearchIndex(searchIndexJson);

  // Build and save Facets table
  console.log(`[sync] Building filters and facets table...`);
  const facetsData = FacetBuilder.build(allActiveTitles, targetDate.toISOString().split('T')[0]);
  jsonStore.writeFacets(facetsData);

  // Write meta.json
  const movieCount = allActiveTitles.filter((t) => t.type === 'movie').length;
  const tvCount = allActiveTitles.filter((t) => t.type === 'tv').length;
  jsonStore.writeMeta({
    schemaVersion: CONFIG.schemaVersion,
    generatedAt: targetDate.toISOString(),
    counts: {
      movies: movieCount,
      tv: tvCount,
      totalTitles: allActiveTitles.length,
      calendarItems: calendarItems.length
    },
    window: {
      start: startIso,
      end: endIso
    }
  });

  console.log(`[sync] Data files written successfully.`);

  if (shouldPublish) {
    console.log(`[sync] Publishing data branch via GitPublisher...`);
    const publisher = new GitPublisher(dataDir);
    const result = publisher.publish(targetDate.toISOString().split('T')[0]);
    console.log(`[sync] ${result.message}`);
  }
}

// Run CLI if called directly
const isDirectCall = process.argv[1]?.endsWith('dist/index.js') || process.argv[1]?.endsWith('src/index.ts');
if (isDirectCall) {
  runSync().catch((err) => {
    console.error(`[sync] Fatal error:`, err);
    process.exit(1);
  });
}
