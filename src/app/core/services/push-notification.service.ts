import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

const DEVICE_ID_KEY = 'tyng_device_id';

interface DeviceInfoLike {
  model?: string;
  manufacturer?: string;
  osVersion?: string;
}

interface DeviceIdLike {
  identifier?: string;
}

interface DevicePluginLike {
  getInfo: () => Promise<DeviceInfoLike>;
  getId: () => Promise<DeviceIdLike>;
}

const Device = registerPlugin<DevicePluginLike>('Device');

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private initialized = false;
  private currentToken: string | null = null;
  private deviceId: string | null = null;

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  getDeviceId(): string | null {
    return this.deviceId || localStorage.getItem(DEVICE_ID_KEY);
  }

  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.initialized) {
      return;
    }

    this.initialized = true;
    await this.ensureDeviceId();

    try {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token: Token) => {
        this.currentToken = token.value;
        void this.syncToken(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.warn('Push registration error', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.info('Push received in foreground', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        this.handleNotificationTap(action.notification);
      });
    } catch (error) {
      console.warn('Push notification init failed', error);
    }
  }

  async syncIfAuthenticated(): Promise<void> {
    if (!this.auth.getToken()) {
      return;
    }

    await this.init();

    if (this.currentToken) {
      await this.syncToken(this.currentToken);
    }
  }

  async unregister(): Promise<void> {
    const token = this.currentToken;
    const deviceId = this.getDeviceId();

    if (!this.auth.getToken()) {
      this.currentToken = null;
      return;
    }

    try {
      await firstValueFrom(
        this.api.delete('/device-token', {
          token: token || undefined,
          device_id: deviceId || undefined,
        }),
      );
    } catch {
      // Ignore unregister failures on logout.
    } finally {
      this.currentToken = null;
    }
  }

  private async syncToken(token: string): Promise<void> {
    if (!this.auth.getToken()) {
      return;
    }

    try {
      const details = await this.collectDeviceDetails();
      await firstValueFrom(
        this.api.post('/device-token', {
          token,
          ...details,
        }),
      );
    } catch (error) {
      console.warn('Failed to sync device token', error);
    }
  }

  private async collectDeviceDetails(): Promise<{
    platform: string;
    device_id: string | null;
    device_model: string | null;
    device_manufacturer: string | null;
    os_version: string | null;
    app_version: string | null;
  }> {
    await this.ensureDeviceId();

    let deviceModel: string | null = null;
    let deviceManufacturer: string | null = null;
    let osVersion: string | null = null;
    let appVersion: string | null = null;

    try {
      if (Capacitor.isNativePlatform()) {
        const [device, app] = await Promise.all([
          Device.getInfo().catch(() => ({}) as DeviceInfoLike),
          App.getInfo(),
        ]);
        deviceModel = device.model || null;
        deviceManufacturer = device.manufacturer || null;
        osVersion = device.osVersion || null;
        appVersion = app.version || null;
      }
    } catch {
      // Fall back to platform-only details.
    }

    return {
      platform: Capacitor.getPlatform() === 'ios' ? 'ios' : Capacitor.getPlatform() === 'web' ? 'web' : 'android',
      device_id: this.getDeviceId(),
      device_model: deviceModel,
      device_manufacturer: deviceManufacturer,
      os_version: osVersion,
      app_version: appVersion,
    };
  }

  private async ensureDeviceId(): Promise<void> {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      this.deviceId = existing;
      return;
    }

    let id: string | null = null;
    try {
      if (Capacitor.isNativePlatform()) {
        const deviceId = await Device.getId();
        id = deviceId.identifier || null;
      }
    } catch {
      id = null;
    }

    if (!id) {
      id = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    }

    localStorage.setItem(DEVICE_ID_KEY, id);
    this.deviceId = id;
  }

  private handleNotificationTap(notification: PushNotificationSchema): void {
    const data = (notification.data || {}) as Record<string, unknown>;
    const action = String(data['action'] || '');
    const bookingId = data['booking_id'] ? String(data['booking_id']) : null;
    const role = this.auth.user()?.role;

    if (action === 'wallet_credit') {
      void this.router.navigateByUrl('/app/wallet');
      return;
    }

    if (action === 'pending_approval' || action === 'created') {
      if (role === 'venue') {
        void this.router.navigateByUrl('/app/venue/bookings');
        return;
      }
    }

    if (action === 'open_game' && bookingId) {
      void this.router.navigateByUrl(`/app/game/${bookingId}`);
      return;
    }

    if (bookingId) {
      if (role === 'venue') {
        void this.router.navigateByUrl('/app/venue/bookings');
        return;
      }
      void this.router.navigateByUrl(`/app/my-bookings/${bookingId}`);
      return;
    }

    void this.router.navigateByUrl(role === 'venue' ? '/app/venue/bookings' : '/app/notifications');
  }
}
