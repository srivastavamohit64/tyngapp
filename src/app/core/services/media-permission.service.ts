import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, type PermissionStatus } from '@capacitor/camera';

type MediaPermission = 'camera' | 'photos';

export type MediaAccessResult = {
  granted: boolean;
  /** True when we should open the system Photo Picker / Camera plugin (even if legacy gallery permission is limited/denied). */
  canUsePicker: boolean;
  status?: PermissionStatus;
};

/**
 * Runtime camera / photo-library permissions for native APK builds.
 *
 * Samsung One UI + Android 13/14 are especially picky:
 * - Manifest alone is not enough (runtime grant required for older gallery APIs)
 * - HTML `<input type="file">` often fails even after a grant
 * - System Photo Picker (Capacitor Camera Photos) works with limited / no broad gallery access
 */
@Injectable({ providedIn: 'root' })
export class MediaPermissionService {
  async ensureCamera(): Promise<boolean> {
    const result = await this.ensureAccess(['camera']);
    return result.granted;
  }

  async ensurePhotos(): Promise<boolean> {
    const result = await this.ensureAccess(['photos']);
    // Android 13+ Photo Picker does not require READ_MEDIA_*; allow picker even if denied.
    return result.granted || result.canUsePicker;
  }

  async ensureCameraAndPhotos(): Promise<boolean> {
    const cam = await this.ensureAccess(['camera']);
    const photos = await this.ensureAccess(['photos']);
    return cam.granted && (photos.granted || photos.canUsePicker);
  }

  async ensureAccess(permissions: MediaPermission[]): Promise<MediaAccessResult> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: true, canUsePicker: true };
    }

    const wantsPhotos = permissions.includes('photos');
    const wantsCamera = permissions.includes('camera');

    try {
      let status = await Camera.checkPermissions();
      const needsRequest = permissions.some((key) => !this.isAllowed(status, key));
      if (needsRequest) {
        status = await Camera.requestPermissions({ permissions });
      }

      const granted = permissions.every((key) => this.isAllowed(status, key));
      const photosOk = !wantsPhotos || this.isAllowed(status, 'photos');
      const cameraOk = !wantsCamera || this.isAllowed(status, 'camera');

      // On Android, Capacitor Camera Photos uses the system picker which works
      // with "limited" / Selected Photos Access and often without a broad grant.
      const canUsePicker =
        Capacitor.getPlatform() === 'android'
          ? (wantsPhotos ? photosOk || this.isPickerFriendly(status.photos) : true) &&
            (wantsCamera ? cameraOk : true)
          : granted;

      return { granted, canUsePicker: canUsePicker || granted, status };
    } catch (error) {
      console.warn('Media permission request failed', error);
      // Still allow Android Photo Picker attempt — many Samsungs surface the picker
      // without a prior runtime grant succeeding in the Capacitor bridge.
      return {
        granted: false,
        canUsePicker: Capacitor.getPlatform() === 'android' && wantsPhotos && !wantsCamera,
      };
    }
  }

  private isAllowed(status: PermissionStatus, key: MediaPermission): boolean {
    const value = status[key];
    return value === 'granted' || value === 'limited';
  }

  /** Prompt / denied can still open the Android Photo Picker on API 33+. */
  private isPickerFriendly(value: string | undefined): boolean {
    return value === 'granted' || value === 'limited' || value === 'prompt' || value === 'denied';
  }
}
