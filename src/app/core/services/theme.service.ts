import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  /** Figma design is light-first; default to light unless user saved dark. */
  private isDarkMode = false;

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = false;
      localStorage.setItem('theme', 'light');
    }
    this.applyTheme(this.isDarkMode);
  }

  isDark(): boolean {
    return this.isDarkMode;
  }

  setTheme(isDark: boolean) {
    this.isDarkMode = isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.applyTheme(isDark);
  }

  toggleTheme() {
    this.setTheme(!this.isDarkMode);
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

    if (Capacitor.isNativePlatform()) {
      try {
        // Keep edge-to-edge so CSS safe-area insets work on notch / punch-hole / nav bar.
        void StatusBar.setOverlaysWebView({ overlay: true });
        void StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        void StatusBar.setBackgroundColor({ color: '#00000000' });
      } catch (e) {
        console.warn('Capacitor StatusBar styling error', e);
      }
    }
  }
}
