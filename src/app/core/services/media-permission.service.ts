import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, type PermissionStatus } from '@capacitor/camera';

type MediaPermission = 'camera' | 'photos';

/**
 * Runtime camera / photo-library permissions for native APK builds.
 * Manifest declarations alone are not enough on Android 6+; the WebView
 * camera (`capture`) and gallery pickers crash or fail without a grant.
 */
@Injectable({ providedIn: 'root' })
export class MediaPermissionService {
  async ensureCamera(): Promise<boolean> {
    return this.ensure(['camera']);
  }

  async ensurePhotos(): Promise<boolean> {
    return this.ensure(['photos']);
  }

  async ensureCameraAndPhotos(): Promise<boolean> {
    return this.ensure(['camera', 'photos']);
  }

  private isAllowed(status: PermissionStatus, key: MediaPermission): boolean {
    const value = status[key];
    return value === 'granted' || value === 'limited';
  }

  private async ensure(permissions: MediaPermission[]): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return true;
    }

    try {
      let status = await Camera.checkPermissions();
      const needsRequest = permissions.some((key) => !this.isAllowed(status, key));
      if (needsRequest) {
        status = await Camera.requestPermissions({ permissions });
      }
      return permissions.every((key) => this.isAllowed(status, key));
    } catch (error) {
      console.warn('Media permission request failed', error);
      return false;
    }
  }
}
