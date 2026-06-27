import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = true;

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      // Default to dark mode
      this.isDarkMode = true;
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

    // Update Capacitor status bar if native
    if (Capacitor.isNativePlatform()) {
      try {
        void StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        void StatusBar.setBackgroundColor({ color: isDark ? '#0a0f1c' : '#f8fafc' });
      } catch (e) {
        console.warn('Capacitor StatusBar styling error', e);
      }
    }
  }
}
