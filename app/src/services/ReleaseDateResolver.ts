import { MediaType, TitleDetail } from '../types/index.js';
import { DataRepository } from './DataRepository.js';
import { WorkerClient } from './WorkerClient.js';

export interface ReleaseInfo {
  readonly found: boolean;
  readonly nextDate: string | null;
}

export class ReleaseDateResolver {
  private static readonly detailCache = new Map<string, Promise<TitleDetail | null>>();

  public constructor(
    private readonly dataRepo: DataRepository = new DataRepository(),
    private readonly workerClient: WorkerClient = new WorkerClient()
  ) {}

  public async resolve(type: MediaType, id: number, todayIso: string = this.todayIso()): Promise<ReleaseInfo> {
    const detail = await this.loadDetail(type, id);
    if (!detail) return { found: false, nextDate: null };
    return { found: true, nextDate: this.pickUpcomingDate(detail, todayIso) };
  }

  public pickUpcomingDate(detail: TitleDetail, todayIso: string): string | null {
    const candidates = [detail.nextEpisodeToAir?.airDate, detail.theatricalDate, detail.digitalDate].filter(
      (d): d is string => Boolean(d) && (d as string) >= todayIso
    );
    return candidates.length > 0 ? candidates.sort()[0] : null;
  }

  private loadDetail(type: MediaType, id: number): Promise<TitleDetail | null> {
    const key = `${type}-${id}`;
    let pending = ReleaseDateResolver.detailCache.get(key);
    if (!pending) {
      pending = this.fetchDetail(type, id);
      ReleaseDateResolver.detailCache.set(key, pending);
    }
    return pending;
  }

  private async fetchDetail(type: MediaType, id: number): Promise<TitleDetail | null> {
    try {
      const fromData = await this.dataRepo.getTitleDetail(type, id);
      return fromData ?? (await this.workerClient.getTitleDetail(type, id));
    } catch {
      return null;
    }
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }
}
