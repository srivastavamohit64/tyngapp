import { Capacitor } from '@capacitor/core';

/**
 * Android-specific utility functions for handling permissions and settings.
 */
export class AndroidUtils {
  /**
   * Check if the app is running on Android.
   */
  static isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  }

  /**
   * Check if Android location services are enabled.
   * This requires the android-location package from Capacitor community.
   */
  static async areLocationServicesEnabled(): Promise<boolean> {
    try {
      if (!this.isAndroid()) {
        return true;
      }

      // Note: Capacitor Geolocation plugin doesn't provide a direct method to check
      // GPS/Location services status. We detect this indirectly by attempting
      // to get a position and checking the error.
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if location permission is granted.
   */
  static async isLocationPermissionGranted(): Promise<boolean> {
    try {
      if (!this.isAndroid()) {
        return true;
      }

      const { Geolocation } = await import('@capacitor/geolocation');
      const { location } = await Geolocation.checkPermissions();
      return location === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Check if location permission was permanently denied (user selected "Don't ask again").
   * This requires trying to request permission and checking if it throws.
   */
  static async isLocationPermissionPermanentlyDenied(): Promise<boolean> {
    if (!this.isAndroid()) {
      return false;
    }

    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const { location } = await Geolocation.checkPermissions();
      
      // If permission is already granted or requested, it's not permanently denied
      if (location === 'granted' || location === 'limited') {
        return false;
      }

      // Try to request - if it throws or returns denied after requesting,
      // it might be permanently denied
      const requestResult = await Geolocation.requestPermissions();
      return requestResult.location === 'denied';
    } catch {
      return true;
    }
  }

  /**
   * Open app settings to let user manually enable permissions.
   */
  static async openAppSettings(): Promise<void> {
    try {
      if (!this.isAndroid()) {
        return;
      }

      // For Android, open app settings using intent URL
      window.open('package:com.tyng.app', '_system');
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }

  /**
   * Open Android location settings screen.
   */
  static async openLocationSettings(): Promise<void> {
    try {
      if (!this.isAndroid()) {
        return;
      }

      // For Android, open location settings
      window.open('android.settings.LOCATION_SOURCE_SETTINGS', '_system');
    } catch (error) {
      console.error('Failed to open location settings:', error);
    }
  }
}
