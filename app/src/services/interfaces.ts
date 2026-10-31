import {
  CalendarItem,
  CustomList,
  FacetsData,
  KnownId,
  ListItemRecord,
  MediaType,
  MetaData,
  TitleDetail
} from '../types/index.js';

export interface IDataRepository {
  getMeta(): Promise<MetaData>;
  getKnownIds(): Promise<KnownId[]>;
  getCalendarMonth(yearMonth: string): Promise<CalendarItem[]>;
  getTitleDetail(type: MediaType, id: number): Promise<TitleDetail | null>;
  getSearchIndex(): Promise<string>;
  getFacets(): Promise<FacetsData>;
}

export interface IWorkerClient {
  getImageUrl(size: string, path: string | null): string;
  getTitleDetail(type: MediaType, id: number): Promise<TitleDetail>;
  searchLive(query: string): Promise<{ results: any[] }>;
}

export interface IListRepository {
  getFavorites(): Promise<ListItemRecord[]>;
  isFavorite(type: MediaType, id: number): Promise<boolean>;
  toggleFavorite(type: MediaType, id: number, title?: string, posterPath?: string | null): Promise<boolean>;
  toggleWatched(type: MediaType, id: number): Promise<boolean>;
  getCustomLists(): Promise<CustomList[]>;
  createCustomList(name: string): Promise<CustomList>;
  updateCustomList(list: CustomList): Promise<void>;
  deleteCustomList(id: string): Promise<void>;
  addToList(listId: string, type: MediaType, id: number, title?: string, posterPath?: string | null): Promise<void>;
  removeFromList(listId: string, type: MediaType, id: number): Promise<void>;
  exportBackup(): Promise<string>;
  importBackup(jsonString: string): Promise<void>;
}

export interface CalendarDayCell {
  jYear: number;
  jMonth: number;
  jDay: number;
  dateIso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isFriday: boolean;
  persianDayText: string;
}

export interface IJalaliDateService {
  toJalaali(gregorianDate: Date | string): { jy: number; jm: number; jd: number };
  toGregorian(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number };
  formatJalali(date: Date | string, formatPattern?: string): string;
  getMonthName(jm: number): string;
  getMonthGrid(jy: number, jm: number): CalendarDayCell[];
  isLeapYear(jy: number): boolean;
}

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  formatted: string;
}

export interface ICountdownService {
  calculate(targetIsoDate: string): CountdownResult;
}

export interface IThemeService {
  getCurrentTheme(): 'system' | 'light' | 'dark';
  setTheme(theme: 'system' | 'light' | 'dark'): void;
}
