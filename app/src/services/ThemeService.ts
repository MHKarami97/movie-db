import { IThemeService } from './interfaces.js';

export class ThemeService implements IThemeService {
  private storageKey = 'app_theme';

  constructor() {
    this.init();
  }

  public getCurrentTheme(): 'system' | 'light' | 'dark' {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
    return 'system';
  }

  public setTheme(theme: 'system' | 'light' | 'dark'): void {
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  private init(): void {
    const theme = this.getCurrentTheme();
    this.applyTheme(theme);

    // Watch for system preference changes if 'system' is selected
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.getCurrentTheme() === 'system') {
        this.applyTheme('system');
      }
    });
  }

  private applyTheme(theme: 'system' | 'light' | 'dark'): void {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const root = document.documentElement;
    if (isDark) {
      root.classList.remove('light');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#f8fafc');
    }
  }
}
