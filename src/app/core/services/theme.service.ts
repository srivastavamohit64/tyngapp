import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export interface AppThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text_primary: string;
  text_secondary: string;
  button: string;
  success: string;
  warning: string;
  error: string;
}

export interface AppThemePayload {
  id?: number;
  name?: string;
  updated_at?: string | null;
  colors: AppThemeColors;
  branding?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

const THEME_MODE_KEY = 'theme';
const THEME_CACHE_KEY = 'tyng_app_theme';
const AUTH_TOKEN_KEY = 'tyng_auth_token';

export const DEFAULT_APP_THEME_COLORS: AppThemeColors = {
  primary: '#8CF000',
  secondary: '#FF7A00',
  accent: '#38BDF8',
  background: '#FAFBFC',
  card: '#FFFFFF',
  text_primary: '#111827',
  text_secondary: '#6B7280',
  button: '#8CF000',
  success: '#8CF000',
  warning: '#FF7A00',
  error: '#EF4444',
};

/**
 * Dark/light mode + dynamic brand colors from Laravel Theme Settings.
 * Cached locally so startup applies colors before the network returns.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly api = inject(ApiService);

  /** Figma design is light-first; default to light unless user saved dark. */
  private isDarkMode = false;
  private colors: AppThemeColors = { ...DEFAULT_APP_THEME_COLORS };
  private refreshedThisSession = false;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    const savedTheme = localStorage.getItem(THEME_MODE_KEY);
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = false;
      localStorage.setItem(THEME_MODE_KEY, 'light');
    }

    // Apply cached brand colors immediately to avoid UI flicker.
    this.colors = this.readCachedColors();
    this.applyBrandColors(this.colors);
    this.applyTheme(this.isDarkMode);
  }

  isDark(): boolean {
    return this.isDarkMode;
  }

  getColors(): AppThemeColors {
    return { ...this.colors };
  }

  setTheme(isDark: boolean) {
    this.isDarkMode = isDark;
    localStorage.setItem(THEME_MODE_KEY, isDark ? 'dark' : 'light');
    this.applyTheme(isDark);
  }

  toggleTheme() {
    this.setTheme(!this.isDarkMode);
  }

  /**
   * Startup / post-login: apply cache (already done), then refresh once from API.
   */
  async init(): Promise<void> {
    this.applyBrandColors(this.colors);
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      return;
    }
    await this.refreshFromApi();
  }

  /**
   * Fetch theme once per app session (or when force=true).
   * Offline / errors keep the cached palette.
   */
  async refreshFromApi(force = false): Promise<void> {
    if (this.refreshedThisSession && !force) {
      return;
    }
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      return;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await firstValueFrom(this.api.get<AppThemePayload>('/app/theme'));
        if (!response.success || !response.data?.colors) {
          return;
        }
        const next = this.normalizeColors(response.data.colors);
        this.colors = next;
        this.writeCache(response.data);
        this.applyBrandColors(next);
        this.refreshedThisSession = true;
      } catch (error) {
        console.warn('[theme] Unable to refresh theme from API — using cache/defaults', error);
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /** Explicit admin/debug refresh (also usable from settings). */
  async forceRefresh(): Promise<void> {
    this.refreshedThisSession = false;
    await this.refreshFromApi(true);
  }

  private applyTheme(isDark: boolean) {
    const root = document.documentElement;
    const body = document.body;

    if (isDark) {
      root.classList.remove('light-mode');
      body.classList.remove('light-mode');
      root.classList.add('dark-mode');
      body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
      body.classList.remove('dark-mode');
      root.classList.add('light-mode');
      body.classList.add('light-mode');
    }

    // Re-apply brand colors so dark/light class switches don't wipe tokens.
    this.applyBrandColors(this.colors);

    if (Capacitor.isNativePlatform()) {
      try {
        void StatusBar.setOverlaysWebView({ overlay: true });
        void StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        void StatusBar.setBackgroundColor({ color: '#00000000' });
      } catch (e) {
        console.warn('Capacitor StatusBar styling error', e);
      }
    }
  }

  private applyBrandColors(colors: AppThemeColors): void {
    const root = document.documentElement;
    const primary = colors.primary;
    const secondary = colors.secondary;
    const accent = colors.accent;
    const background = colors.background;
    const card = colors.card;
    const textPrimary = colors.text_primary;
    const textSecondary = colors.text_secondary;
    const button = colors.button;
    const success = colors.success;
    const warning = colors.warning;
    const error = colors.error;

    const primaryRgb = hexToRgbCsv(primary);
    const secondaryRgb = hexToRgbCsv(secondary);
    const accentRgb = hexToRgbCsv(accent);
    const backgroundRgb = hexToRgbCsv(background);
    const textPrimaryRgb = hexToRgbCsv(textPrimary);
    const successRgb = hexToRgbCsv(success);
    const warningRgb = hexToRgbCsv(warning);
    const errorRgb = hexToRgbCsv(error);
    const buttonRgb = hexToRgbCsv(button);

    const primaryContrast = contrastColor(primary);
    const secondaryContrast = contrastColor(secondary);
    const successContrast = contrastColor(success);
    const warningContrast = contrastColor(warning);
    const errorContrast = contrastColor(error);
    const buttonContrast = contrastColor(button);

    // Ionic tokens
    root.style.setProperty('--ion-color-primary', primary);
    root.style.setProperty('--ion-color-primary-rgb', primaryRgb);
    root.style.setProperty('--ion-color-primary-contrast', primaryContrast);
    root.style.setProperty('--ion-color-primary-contrast-rgb', hexToRgbCsv(primaryContrast));
    root.style.setProperty('--ion-color-primary-shade', shadeHex(primary, 0.12));
    root.style.setProperty('--ion-color-primary-tint', tintHex(primary, 0.1));

    root.style.setProperty('--ion-color-secondary', secondary);
    root.style.setProperty('--ion-color-secondary-rgb', secondaryRgb);
    root.style.setProperty('--ion-color-secondary-contrast', secondaryContrast);
    root.style.setProperty('--ion-color-secondary-contrast-rgb', hexToRgbCsv(secondaryContrast));
    root.style.setProperty('--ion-color-secondary-shade', shadeHex(secondary, 0.12));
    root.style.setProperty('--ion-color-secondary-tint', tintHex(secondary, 0.1));

    root.style.setProperty('--ion-color-tertiary', accent);
    root.style.setProperty('--ion-color-tertiary-rgb', accentRgb);
    root.style.setProperty('--ion-color-tertiary-contrast', contrastColor(accent));
    root.style.setProperty('--ion-color-tertiary-shade', shadeHex(accent, 0.12));
    root.style.setProperty('--ion-color-tertiary-tint', tintHex(accent, 0.1));

    root.style.setProperty('--ion-color-success', success);
    root.style.setProperty('--ion-color-success-rgb', successRgb);
    root.style.setProperty('--ion-color-success-contrast', successContrast);
    root.style.setProperty('--ion-color-success-shade', shadeHex(success, 0.12));
    root.style.setProperty('--ion-color-success-tint', tintHex(success, 0.1));

    root.style.setProperty('--ion-color-warning', warning);
    root.style.setProperty('--ion-color-warning-rgb', warningRgb);
    root.style.setProperty('--ion-color-warning-contrast', warningContrast);
    root.style.setProperty('--ion-color-warning-shade', shadeHex(warning, 0.12));
    root.style.setProperty('--ion-color-warning-tint', tintHex(warning, 0.1));

    root.style.setProperty('--ion-color-danger', error);
    root.style.setProperty('--ion-color-danger-rgb', errorRgb);
    root.style.setProperty('--ion-color-danger-contrast', errorContrast);
    root.style.setProperty('--ion-color-danger-shade', shadeHex(error, 0.12));
    root.style.setProperty('--ion-color-danger-tint', tintHex(error, 0.1));

    root.style.setProperty('--ion-background-color', background);
    root.style.setProperty('--ion-background-color-rgb', backgroundRgb);
    root.style.setProperty('--ion-text-color', textPrimary);
    root.style.setProperty('--ion-text-color-rgb', textPrimaryRgb);

    // App design tokens
    root.style.setProperty('--app-primary', primary);
    root.style.setProperty('--app-primary-rgb', primaryRgb);
    root.style.setProperty('--app-primary-to', tintHex(primary, 0.18));
    root.style.setProperty('--app-secondary', secondary);
    root.style.setProperty('--app-secondary-rgb', secondaryRgb);
    root.style.setProperty('--app-accent', accent);
    root.style.setProperty('--app-accent-rgb', accentRgb);
    root.style.setProperty('--app-background', background);
    root.style.setProperty('--app-background-secondary', background);
    root.style.setProperty('--app-card', card);
    root.style.setProperty('--app-foreground', textPrimary);
    root.style.setProperty('--app-foreground-secondary', textSecondary);
    root.style.setProperty('--app-muted-text', textSecondary);
    root.style.setProperty('--app-button', button);
    root.style.setProperty('--app-button-rgb', buttonRgb);
    root.style.setProperty('--app-button-contrast', buttonContrast);
    root.style.setProperty('--app-success', success);
    root.style.setProperty('--app-warning', warning);
    root.style.setProperty('--app-error', error);
    root.style.setProperty('--app-info', accent);
  }

  private readCachedColors(): AppThemeColors {
    try {
      const raw = localStorage.getItem(THEME_CACHE_KEY);
      if (!raw) return { ...DEFAULT_APP_THEME_COLORS };
      const parsed = JSON.parse(raw) as AppThemePayload;
      return this.normalizeColors(parsed?.colors || DEFAULT_APP_THEME_COLORS);
    } catch {
      return { ...DEFAULT_APP_THEME_COLORS };
    }
  }

  private writeCache(payload: AppThemePayload): void {
    try {
      const toStore: AppThemePayload = {
        ...payload,
        colors: this.normalizeColors(payload.colors),
      };
      localStorage.setItem(THEME_CACHE_KEY, JSON.stringify(toStore));
    } catch {
      // ignore quota / private mode
    }
  }

  private normalizeColors(input: Partial<AppThemeColors> | null | undefined): AppThemeColors {
    const next = { ...DEFAULT_APP_THEME_COLORS };
    (Object.keys(DEFAULT_APP_THEME_COLORS) as (keyof AppThemeColors)[]).forEach((key) => {
      const value = normalizeHex(input?.[key]);
      if (value) next[key] = value;
    });
    return next;
  }
}

function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let hex = value.trim();
  if (!hex) return null;
  if (hex[0] !== '#') hex = `#${hex}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  return hex.toUpperCase();
}

function hexToRgbCsv(hex: string): string {
  const normalized = normalizeHex(hex) || '#000000';
  const n = parseInt(normalized.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r}, ${g}, ${b}`;
}

function contrastColor(hex: string): string {
  const normalized = normalizeHex(hex) || '#000000';
  const n = parseInt(normalized.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  // Relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#111827' : '#FFFFFF';
}

function shadeHex(hex: string, amount: number): string {
  return mixHex(hex, '#000000', amount);
}

function tintHex(hex: string, amount: number): string {
  return mixHex(hex, '#FFFFFF', amount);
}

function mixHex(hex: string, mixWith: string, amount: number): string {
  const a = normalizeHex(hex) || '#000000';
  const b = normalizeHex(mixWith) || '#000000';
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * amount);
  const g = Math.round(ag + (bg - ag) * amount);
  const bl = Math.round(ab + (bb - ab) * amount);
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`.toUpperCase();
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
}
