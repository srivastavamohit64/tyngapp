import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tyng.app',
  appName: 'TYNG',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
      backgroundColor: '#0a0f1c',
    },
  },
};

export default config;
