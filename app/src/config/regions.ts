export interface RegionOption {
  readonly code: string;
  readonly label: string;
}

export const SUPPORTED_REGIONS: readonly RegionOption[] = [
  { code: 'US', label: 'آمریکا' },
  { code: 'GB', label: 'انگلیس' },
  { code: 'CN', label: 'چین' },
  { code: 'AE', label: 'امارات' }
];

export const DEFAULT_REGION = 'US';

export class RegionPolicy {
  private static readonly codes = new Set(SUPPORTED_REGIONS.map((r) => r.code));

  public static isSupported(code: string | null | undefined): code is string {
    return Boolean(code) && this.codes.has(code as string);
  }

  public static normalize(code: string | null | undefined): string {
    return this.isSupported(code) ? code : DEFAULT_REGION;
  }

  public static labelOf(code: string): string {
    return SUPPORTED_REGIONS.find((r) => r.code === code)?.label ?? code;
  }

  public static codeList(): string[] {
    return SUPPORTED_REGIONS.map((r) => r.code);
  }
}
