import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AlertController } from '@ionic/angular';
import { fetchWebPathAsImageFile } from '../utils/image-file.util';
import { MediaPermissionService } from './media-permission.service';

/**
 * Native-first image capture / gallery pick.
 * Avoids HTML file inputs on Android (unreliable on many Samsung devices).
 */
@Injectable({ providedIn: 'root' })
export class NativeMediaPickerService {
  private readonly permissions = inject(MediaPermissionService);
  private readonly alertCtrl = inject(AlertController);

  async takePhoto(namePrefix = 'camera'): Promise<File | null> {
    const allowed = await this.permissions.ensureCamera();
    if (!allowed) {
      await this.alert(
        'Permission needed',
        'Camera access is required to take a photo. Enable Camera for TYNG in App settings.',
      );
      return null;
    }

    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        correctOrientation: true,
        saveToGallery: false,
      });
      if (!photo.webPath) {
        await this.alert('Camera', 'Camera did not return an image. Please try again.');
        return null;
      }
      return fetchWebPathAsImageFile(photo.webPath, namePrefix);
    } catch (error: unknown) {
      const message = String((error as { message?: string })?.message || error || '');
      if (/cancel/i.test(message)) return null;
      console.warn('Native camera failed', error);
      await this.alert(
        'Camera',
        'Unable to open the camera on this device. Check camera permission in App settings, then try again.',
      );
      return null;
    }
  }

  /**
   * Pick one image from the gallery via Capacitor Camera (system Photo Picker on Android 13+).
   * Returns null if cancelled; throws/alerts on hard failure.
   */
  async pickPhoto(namePrefix = 'gallery'): Promise<File | null> {
    const allowed = await this.permissions.ensurePhotos();
    if (!allowed) {
      await this.alert(
        'Permission needed',
        'Photo access is required to choose an image. Enable Photos / Files for TYNG in App settings.',
      );
      return null;
    }

    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        correctOrientation: true,
      });
      if (!photo.webPath) {
        await this.alert('Photos', 'No image was selected. Please try again.');
        return null;
      }
      return fetchWebPathAsImageFile(photo.webPath, namePrefix);
    } catch (error: unknown) {
      const message = String((error as { message?: string })?.message || error || '');
      if (/cancel/i.test(message)) return null;
      console.warn('Native photo picker failed', error);
      await this.alert(
        'Photos',
        'Unable to open the photo library on this device. Enable Photos permission in App settings, then try again.',
      );
      return null;
    }
  }

  /**
   * Pick multiple images (venue gallery). Falls back to single pick if pickImages is unavailable.
   */
  async pickPhotos(namePrefix = 'gallery', limit = 8): Promise<File[]> {
    const allowed = await this.permissions.ensurePhotos();
    if (!allowed) {
      await this.alert(
        'Permission needed',
        'Photo access is required to choose images. Enable Photos / Files for TYNG in App settings.',
      );
      return [];
    }

    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    try {
      if (typeof Camera.pickImages === 'function') {
        const result = await Camera.pickImages({
          quality: 85,
          limit,
          correctOrientation: true,
        });
        const paths = (result.photos || [])
          .map((p) => p.webPath)
          .filter((p): p is string => !!p);
        if (!paths.length) return [];
        return Promise.all(paths.map((path, i) => fetchWebPathAsImageFile(path, `${namePrefix}-${i}`)));
      }

      const single = await this.pickPhoto(namePrefix);
      return single ? [single] : [];
    } catch (error: unknown) {
      const message = String((error as { message?: string })?.message || error || '');
      if (/cancel/i.test(message)) return [];
      console.warn('Native multi photo picker failed, trying single', error);
      const single = await this.pickPhoto(namePrefix);
      return single ? [single] : [];
    }
  }

  private async alert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
