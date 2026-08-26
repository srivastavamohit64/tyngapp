import { Injectable } from '@angular/core';
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

/**
 * Native chrome setup for notch / punch-hole / gesture & 3-button nav.
 * Edge-to-edge is intentional; content clears system bars via CSS
 * `var(--safe-area-*)` (backed by Capacitor SystemBars WindowInsets).
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Prefer SystemBars (Capacitor 8.3+) for edge-to-edge + inset CSS vars.
      // LIGHT = dark icons (for light app chrome).
      await SystemBars.setStyle({ style: SystemBarsStyle.Light });
    } catch (error) {
      console.warn('SystemBars initialization failed', error);
    }

    try {
      // Legacy StatusBar: keep WebView under system bars on older Android.
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch (error) {
      console.warn('StatusBar initialization failed', error);
    }

    try {
      // iOS only — Android uses Keyboard.resizeOnFullScreen from capacitor.config.
      if (Capacitor.getPlatform() === 'ios') {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
      }
    } catch (error) {
      console.warn('Keyboard initialization failed', error);
    }
  }
}
