import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0a0f1c' });
    } catch (error) {
      console.warn('StatusBar initialization failed', error);
    }
  }
}
