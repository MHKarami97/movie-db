import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  CalendarItem,
  FacetsData,
  KnownId,
  MetaData,
  TitleDetail
} from '../types.js';

export class JsonStore {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  public static stableStringify(obj: unknown, space = 2): string {
    const sortKeysRecursively = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map(sortKeysRecursively);
      }
      if (value !== null && typeof value === 'object') {
        const sortedObj: Record<string, unknown> = {};
        const keys = Object.keys(value as Record<string, unknown>).sort();
        for (const k of keys) {
          sortedObj[k] = sortKeysRecursively((value as Record<string, unknown>)[k]);
        }
        return sortedObj;
      }
      return value;
    };

    const sorted = sortKeysRecursively(obj);
    return JSON.stringify(sorted, null, space) + '\n';
  }

  public ensureDirectories(): void {
    const dirs = [
      this.dataDir,
      path.join(this.dataDir, 'calendar'),
      path.join(this.dataDir, 'titles', 'movie'),
      path.join(this.dataDir, 'titles', 'tv'),
      path.join(this.dataDir, 'search'),
      path.join(this.dataDir, 'facets')
    ];
    for (const d of dirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
  }

  public readKnownIds(): KnownId[] {
    const filePath = path.join(this.dataDir, 'ids.json');
    if (!fs.existsSync(filePath)) return [];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as KnownId[];
    } catch {
      return [];
    }
  }

  public writeKnownIds(ids: KnownId[]): void {
    const sorted = [...ids].sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.id - b.id;
    });
    const filePath = path.join(this.dataDir, 'ids.json');
    fs.writeFileSync(filePath, JsonStore.stableStringify(sorted));
  }

  public readAllExistingTitles(): TitleDetail[] {
    const titles: TitleDetail[] = [];
    const baseTitlesDir = path.join(this.dataDir, 'titles');
    if (!fs.existsSync(baseTitlesDir)) return titles;

    for (const type of ['movie', 'tv']) {
      const typeDir = path.join(baseTitlesDir, type);
      if (!fs.existsSync(typeDir)) continue;

      const buckets = fs.readdirSync(typeDir);
      for (const bucket of buckets) {
        const bucketPath = path.join(typeDir, bucket);
        if (!fs.statSync(bucketPath).isDirectory()) continue;

        const files = fs.readdirSync(bucketPath);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          try {
            const content = fs.readFileSync(path.join(bucketPath, file), 'utf-8');
            titles.push(JSON.parse(content) as TitleDetail);
          } catch {
            // Ignore corrupted individual files
          }
        }
      }
    }

    return titles;
  }

  public writeTitleDetail(title: TitleDetail): void {
    const bucket = Math.floor(title.id / 1000).toString();
    const bucketDir = path.join(this.dataDir, 'titles', title.type, bucket);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }
    const filePath = path.join(bucketDir, `${title.id}.json`);
    fs.writeFileSync(filePath, JsonStore.stableStringify(title));
  }

  public removeTitleDetail(type: 'movie' | 'tv', id: number): void {
    const bucket = Math.floor(id / 1000).toString();
    const filePath = path.join(this.dataDir, 'titles', type, bucket, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  public writeCalendar(items: CalendarItem[]): void {
    // Group by YYYY-MM
    const monthGroups = new Map<string, CalendarItem[]>();
    for (const item of items) {
      if (!item.date || item.date.length < 7) continue;
      const monthKey = item.date.substring(0, 7);
      if (!monthGroups.has(monthKey)) {
        monthGroups.set(monthKey, []);
      }
      monthGroups.get(monthKey)!.push(item);
    }

    const calendarDir = path.join(this.dataDir, 'calendar');
    if (!fs.existsSync(calendarDir)) {
      fs.mkdirSync(calendarDir, { recursive: true });
    }

    // Clean existing calendar files
    const existingFiles = fs.readdirSync(calendarDir);
    for (const file of existingFiles) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(calendarDir, file));
      }
    }

    for (const [monthKey, groupItems] of monthGroups.entries()) {
      groupItems.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.id - b.id;
      });
      const filePath = path.join(calendarDir, `${monthKey}.json`);
      fs.writeFileSync(filePath, JsonStore.stableStringify(groupItems));
    }
  }

  public writeFacets(facets: FacetsData): void {
    const filePath = path.join(this.dataDir, 'facets', 'filters.json');
    fs.writeFileSync(filePath, JsonStore.stableStringify(facets));
  }

  public writeSearchIndex(rawJsonString: string): void {
    const filePath = path.join(this.dataDir, 'search', 'index.json');
    // MiniSearch serialized JSON has already been stringified, parse and format consistently
    try {
      const parsed = JSON.parse(rawJsonString);
      fs.writeFileSync(filePath, JsonStore.stableStringify(parsed));
    } catch {
      fs.writeFileSync(filePath, rawJsonString + '\n');
    }
  }

  public writeMeta(meta: MetaData): void {
    const filePath = path.join(this.dataDir, 'meta.json');
    fs.writeFileSync(filePath, JsonStore.stableStringify(meta));
  }
}
