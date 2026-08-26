import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tyng.app',
  appName: 'TYNG',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Capacitor 8.4+: injects --safe-area-inset-* from native WindowInsets
    SystemBars: {
      insetsHandling: 'css',
      // LIGHT = dark icons/text — correct for the app's light surfaces
      style: 'LIGHT',
      hidden: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#00000000',
    },
    Keyboard: {
      // iOS: resize body. Android: resizeOnFullScreen keeps CTAs above IME under edge-to-edge.
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#2212CC',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      // Omit "alert" so foreground pushes use the in-app banner instead of a
      // duplicate OS heads-up. Background/terminated still use system tray.
      presentationOptions: ['badge', 'sound'],
    },
  },
};

export default config;
