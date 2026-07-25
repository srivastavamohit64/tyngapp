import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Native chrome setup for notch / punch-hole / gesture & 3-button nav.
 * We draw edge-to-edge and rely on CSS env(safe-area-inset-*) so content
 * never sits under the status bar or system navigation bar.
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Edge-to-edge: WebView under system bars; CSS safe-area pads content.
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light });
      // Transparent status bar so page backgrounds / headers own the color.
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch (error) {
      console.warn('StatusBar initialization failed', error);
    }
  }
}
